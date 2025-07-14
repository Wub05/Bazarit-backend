export const register = async (req, res, next) => {
  try {
    res.status(201).json({ message: "User registered (placeholder)" });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    res.status(200).json({ message: "User logged in (placeholder)" });
  } catch (err) {
    next(err);
  }
};
