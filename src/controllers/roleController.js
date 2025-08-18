import prisma from '../prisma/client.js';

// CREATE role
export const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;

    const role = await prisma.role.create({
      data: { name, description },
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ all roles
export const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ role by ID
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) return res.status(404).json({ error: 'Role not found' });

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updated = await prisma.role.update({
      where: { id },
      data: { name, description },
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.role.delete({ where: { id } });

    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
