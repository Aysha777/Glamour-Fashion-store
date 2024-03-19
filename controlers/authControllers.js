// const bcrypt = require('bcrypt');
// const User = require('../models/userModel');

// // Handle user login
// async function loginUser(req, res) {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.render('login', { message: "User not found" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.render('login', { message: 'Wrong password' });
//         }

//         req.session.user = user._id;

//         if (user.email === 'adminglamour@gmail.com' && password === 'Admin@123') {
//             req.session.admin = user._id;
//             console.log('Admin logged in:', req.session.admin);
//             return res.redirect('/admin/dash');
//         } else {
//             req.session.user = user._id;
//             console.log('User logged in:', req.session.user);
//             return res.redirect('/user/home');
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// }

// module.exports = {
//     loginUser,
// };
