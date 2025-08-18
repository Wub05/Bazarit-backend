import prisma from "../prisma/client.js";

// 📌 Assign a permission to a role
export const assignPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    // Prevent duplicates
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Permission already assigned to this role." });
    }

    const rolePermission = await prisma.rolePermission.create({
      data: { roleId, permissionId },
    });

    res.status(201).json(rolePermission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Remove a permission from a role
export const removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });

    res.json({ message: "Permission removed from role successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Get all permissions for a specific role
export const getPermissionsByRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!roleWithPermissions) {
      return res.status(404).json({ error: "Role not found." });
    }

    res.json(roleWithPermissions.rolePermissions.map((rp) => rp.permission));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
