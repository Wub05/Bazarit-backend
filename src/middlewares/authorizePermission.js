import prisma from "../prisma/client.js";

/**
 * Middleware to check if the authenticated user has a specific permission
 */
export const authorizePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Make sure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
      }

      // Get all permissions for the user via their roles
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!userWithPermissions) {
        return res.status(401).json({ error: "User not found." });
      }

      // Flatten all permissions from all roles
      const permissions = userWithPermissions.userRoles.flatMap((userRole) =>
        userRole.role.rolePermissions.map((rp) => rp.permission.name)
      );

      // Check if required permission is present
      if (!permissions.includes(permissionName)) {
        return res
          .status(403)
          .json({ error: "Forbidden. Missing required permission." });
      }

      // User is authorized
      next();
    } catch (error) {
      console.error("Authorization Error:", error);
      res
        .status(500)
        .json({ error: "Internal server error during permission check." });
    }
  };
};
