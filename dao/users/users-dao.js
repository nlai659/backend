import { User } from "../../models/user";
import { Centre } from "../../models/centre";
import invalid from "../validator";

const createUser = async (user) => {
  const userInstance = new User(user);
  await userInstance.save();

  console.log("User created " + userInstance);
  return userInstance;
};

const retrieveAllUsers = async () => {
  return await User.find();
};

const checkUsernameUnique = async (username) => {
  const alreadyExists = await User.findOne({ username });

  if (alreadyExists) {
    return false;
  }

  return true;
};

const getUserByUsername = async (username) => {
  return await User.findOne({ username: username.toString() });
};

const getUserById = async (userId) => {
  if (invalid(userId)) {
    return null;
  }
  return await User.findById(userId);
};

const updateUser = async (userId, userUpdates) => {
  if (invalid(userId)) {
    return null;
  }
  return await User.findByIdAndUpdate(userId, userUpdates, { new: true });
};

const deleteUser = async (userId) => {
  if (invalid(userId)) {
    return null;
  }
  return await User.findByIdAndDelete(userId);
};

const registerCentreToUser = async (userId, centreId) => {
  if (invalid(userId) || invalid(centreId)) {
    return null;
  }
  const user = await User.findById(userId);
  const centre = await Centre.findById(centreId);

  user.centre = centre;

  return await user.save();
};

const getCentreByUserId = async (userId) => {
  if (invalid(userId)) {
    return null;
  }
  const user = await User.findById(userId).populate("centre");

  return user.centre;
};

export {
  createUser,
  retrieveAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  registerCentreToUser,
  getCentreByUserId,
  getUserByUsername,
  checkUsernameUnique,
};
