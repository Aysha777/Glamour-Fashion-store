const forgetPasswordController = {};

forgetPasswordController.renderForgetPasswordPage = (req, res) => {
  res.render("forgetpassword", { email: " " });
};

module.exports = forgetPasswordController;
