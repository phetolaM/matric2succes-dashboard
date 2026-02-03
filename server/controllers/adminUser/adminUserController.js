import User from "../../models/adminCredentialModel.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users", error: err });
    }
};

export const addUser = async (req, res) => {
    const { email, password, role = "admin" } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashed, role });
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: "Error adding user", error: err });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;
    try {
        const updateData = { email };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await User.findByIdAndUpdate(id, updateData, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Error updating user", error: err });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: "Error deleting user", error: err });
    }
};
