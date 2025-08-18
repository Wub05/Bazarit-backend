
import prisma from '../prisma/client.js';

export const authorize = ({ requiredPermissions = [], requiredRoles = [] }) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: No user found.' });
      }

      // Fetch user with roles & permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });

      if (!user?.role) {
        return res.status(403).json({ message: 'Forbidden: No role assigned.' });
      }

      const userRoleName = user.role.name;
      const userPermissions = user.role.permissions.map(rp => rp.permission.name);

      // Check role match
      if (requiredRoles.length && !requiredRoles.includes(userRoleName)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient role.' });
      }

      // Check permission match
      if (requiredPermissions.length) {
        const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
        if (!hasPermission) {
          return res.status(403).json({ message: 'Forbidden: Missing permissions.' });
        }
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
};
