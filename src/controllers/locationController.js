import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// ------------ validation ------------
const createSchema = z.object({
  city: z.string().min(1).max(120),
  region: z.string().min(1).max(120),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
});
const patchSchema = createSchema.partial();

const listQuery = z.object({
  city: z.string().min(1).max(120).optional(),
  region: z.string().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

const nearbyQuery = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  radiusKm: z.coerce.number().positive().max(200),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

// ------------ helpers ------------
const asyncH = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ------------ controller functions ------------

export const createLocation = asyncH(async (req, res) => {
  const data = createSchema.parse(req.body);
  const loc = await prisma.location.create({ data });
  res.status(201).json({ location: loc });
});

export const updateLocation = asyncH(async (req, res) => {
  const { locationId } = req.params;
  const data = patchSchema.parse(req.body);
  const loc = await prisma.location.update({
    where: { id: locationId },
    data,
  });
  res.json({ location: loc });
});

export const deleteLocation = asyncH(async (req, res) => {
  const { locationId } = req.params;

  const loc = await prisma.location.findUnique({ where: { id: locationId } });
  if (!loc) return res.status(404).json({ error: "Location not found" });

  const shopsCount = await prisma.shop.count({ where: { locationId } });
  if (shopsCount > 0) {
    return res
      .status(400)
      .json({ error: "Cannot delete location with assigned shops" });
  }

  await prisma.location.delete({ where: { id: locationId } });
  res.json({ message: "Location deleted successfully", locationId });
});

export const getLocation = asyncH(async (req, res) => {
  const { locationId } = req.params;
  const loc = await prisma.location.findUnique({ where: { id: locationId } });
  if (!loc) return res.status(404).json({ error: "Location not found" });
  res.json({ location: loc });
});

export const listLocations = asyncH(async (req, res) => {
  const q = listQuery.parse(req.query);
  const where = {
    AND: [
      q.city ? { city: { contains: q.city, mode: "insensitive" } } : {},
      q.region ? { region: { contains: q.region, mode: "insensitive" } } : {},
    ],
  };
  const locations = await prisma.location.findMany({
    where,
    orderBy: { id: "desc" },
    take: q.limit,
  });
  res.json({ count: locations.length, locations });
});

export const nearbyLocations = asyncH(async (req, res) => {
  const { lat, lng, radiusKm, limit } = nearbyQuery.parse(req.query);

  const sql = Prisma.sql;
  const rows = await prisma.$queryRaw`
    SELECT l.*,
      (6371 * acos(
        cos(radians(${lat})) * cos(radians(l."latitude")) *
        cos(radians(l."longitude") - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(l."latitude"))
      )) AS distance_km
    FROM "Location" l
    WHERE l."latitude" BETWEEN ${lat} - 2 AND ${lat} + 2
      AND l."longitude" BETWEEN ${lng} - 2 AND ${lng} + 2
      AND (6371 * acos(
        cos(radians(${lat})) * cos(radians(l."latitude")) *
        cos(radians(l."longitude") - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(l."latitude"))
      )) <= ${radiusKm}
    ORDER BY distance_km ASC
    LIMIT ${limit};
  `;
  res.json({ count: rows.length, locations: rows });
});

export const getShopLocation = asyncH(async (req, res) => {
  const { shopId } = req.params;
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, location: true },
  });
  if (!shop) return res.status(404).json({ error: "Shop not found" });
  res.json({ shopId, location: shop.location });
});

export const reassignShopLocation = asyncH(async (req, res) => {
  const { shopId } = req.params;
  const { locationId } = z
    .object({ locationId: z.string().uuid() })
    .parse(req.body);

  const [shop, loc] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } }),
    prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    }),
  ]);

  if (!shop) return res.status(404).json({ error: "Shop not found" });
  if (!loc) return res.status(404).json({ error: "Location not found" });

  await prisma.shop.update({
    where: { id: shopId },
    data: { locationId },
  });
  res.json({ message: "Shop location updated", shopId, locationId });
});
