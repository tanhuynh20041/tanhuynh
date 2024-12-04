const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const users = require("../models/users");
const fs = require('fs');

//image upload
var storage = multer.diskStorage({
destination: function (req, file, cb) {
    cb(null, "./uploads");
},
filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
},
});

var upload = multer({
storage: storage,
}).single("image");

// insert as user into database route
router.post("/add", upload, async (req, res) => {
try {
    console.log(req.body);
    console.log(req.file);

    // Tạo người dùng mới
    const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.file ? req.file.filename : null,
    });

    await user.save();

    req.session.message = {
    type: "success",
    message: "User added successfully!",
    };
    res.redirect("/");
} catch (err) {
    console.error(err);
    req.session.message = {
    type: "danger",
    message: "Error adding user.",
    };
    res.redirect("/");
}
});
router.get("/", (req, res) => {
    User.find()
        .exec()
        .then(users => {
            res.render('index', {
                title: 'Home Page',
                users: users,
            });
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});


router.get("/add", (req, res) => {
res.render("add_users", { title: "Add Users" });
});

// Edit an user route
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;

    User.findById(id)
        .then(user => {
            if (!user) {
                return res.redirect('/');
            }
            res.render('edit_users', {
                title: 'Edit User',
                user: user,
            });
        })
        .catch(err => {
            console.error(err);
            res.redirect('/');
        });
});

// Update user route
router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        }, { new: true });

        if (!updatedUser) {
            return res.json({ message: 'User not found', type: 'danger' });
        }

        req.session.message = {
            type: 'success',
            message: 'User updated successfully',
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

// delete user route
router.get('/delete/:id', async (req, res) => {
    let id = req.params.id;

    try {
        const result = await User.findByIdAndDelete(id);  // Thay 'findByIdAndRemove' bằng 'findByIdAndDelete'
        
        if (!result) {
            return res.json({ message: 'User not found' });
        }

        // Nếu có ảnh, xóa ảnh đã tải lên
        if (result.image != '') {
            try {
                fs.unlinkSync('./upload/' + result.image);
            } catch (err) {
                console.log(err);
            }
        }

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully!',
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message });
    }
});


module.exports = router;
