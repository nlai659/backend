import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const isVolunteer = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (
      req.user.userType === "Volunteer" ||
      req.user.userType === "Admin" ||
      req.user.userType === "Vet"
    ) {
      next();
    } else {
      res.sendStatus(403);
    }
  });
};

export const isVet = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.userType === "Vet" || req.user.userType === "Admin") {
      next();
    } else {
      res.sendStatus(403);
    }
  });
};

export const isAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.userType === "Admin") {
      next();
    } else {
      res.sendStatus(403);
    }
  });
};
