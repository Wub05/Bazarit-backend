import prisma from '../prisma/client.js';

// CREATE permission
export const createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    const permission = await prisma.permission.create({
      data: { name, description },
    });

    res.status(201).json(permission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ all permissions
export const getPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ permission by ID
export const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!permission) return res.status(404).json({ error: 'Permission not found' });

    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE permission
export const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updated = await prisma.permission.update({
      where: { id },
      data: { name, description },
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE permission
export const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.permission.delete({ where: { id } });

    res.json({ message: 'Permission deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
