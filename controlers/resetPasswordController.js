const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const resetPasswordController = {};

resetPasswordController.renderResetPasswordPage = async (req, res) => {
  const token = req.query.token || "";
  const newPassword = req.body.newPassword;
  console.log("Token extracted from query string:", token);
  console.log("New Password:", newPassword);
  res.render("resetpassword", { token: token || "", message: "" });
};

resetPasswordController.resetPassword = async (req, res) => {
  try {
    console.log("Reset password route reached");

    const { token, newPassword } = req.body;
    console.log("Received token:", token);
    console.log("Received new password:", newPassword);

    // Validate input data
    if (!token || !newPassword) {
      console.log("Invalid request. Token and newPassword are required.");
      return res.status(400).render("resetpassword", {
        token,
        message: "Invalid request. Token and newPassword are required.",
      });
    }

    // Find the user using the reset token
    const user = await User.findOne({ resetToken: token });

    // Check if the user exists and the reset token is not expired
    if (
      !user ||
      !user.resetTokenExpiration ||
      user.resetTokenExpiration < new Date()
    ) {
      console.log("Invalid or expired token. Please try again.");
      return res.status(400).render("resetpassword", {
        token,
        message: "Invalid or expired token. Please try again.",
      });
    }

    // Continue with the password reset logic
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    // Redirect to the login page or show a success message
    console.log("Password reset successful.");
    return res.render("login", {
      message:
        "Password reset successful. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .render("resetpassword", { token, message: "Internal Server Error" });
  }
};

module.exports = resetPasswordController;
