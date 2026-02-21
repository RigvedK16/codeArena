const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;
  if (!firstName || !lastName) {
    throw new Error("Name not valid ");
  } else if (firstName.length < 4 || lastName.length > 20) {
    throw new Error("Name not in range of 4 to 20 chars ");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Not an email  ");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Weak passwrod");
  }
};
const validateEditData = (req) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "age",
    "gender",
    "about",
    "photoUrl",
    "skills",
  ];

  const updates = Object.keys(req.body);

  if (updates.length === 0) {
    throw new Error("No fields provided for update");
  }

  const isValidOperation = updates.every((field) =>
    allowedFields.includes(field),
  );

  if (!isValidOperation) {
    throw new Error("Invalid fields in update request");
  }

  if (req.body.firstName && req.body.firstName.length < 4) {
    throw new Error("First name must be at least 4 characters");
  }

  if (
    req.body.age !== undefined &&
    (typeof req.body.age !== "number" || Number.isNaN(req.body.age))
  ) {
    throw new Error("Age must be a valid number");
  }

  if (
    req.body.gender &&
    !["male", "female", "others"].includes(req.body.gender.toLowerCase())
  ) {
    throw new Error("Invalid gender value");
  }

  if (
    req.body.skills &&
    (!Array.isArray(req.body.skills) ||
      req.body.skills.some((skill) => skill.trim() === ""))
  ) {
    throw new Error("Skills must be a valid array");
  }

  return true;
};

module.exports = {
  validateSignUpData,
  validateEditData,
};
