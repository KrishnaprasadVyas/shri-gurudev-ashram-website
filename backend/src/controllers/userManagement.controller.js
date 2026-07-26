const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { mobile: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.role && req.query.role !== "ALL") {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .select("name mobile role isCollector createdAt lastLogin")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    const adminId = req.user.id;
    const adminRole = req.user.role;

    if (!newRole) {
      return res.status(400).json({ success: false, message: "New role is required" });
    }

    // Safety 1: Must be a current User schema role. SYSTEM_ADMIN is excluded:
    // privileged administrator assignment remains a database-level break-glass operation.
    const validRoles = [
      "USER", "COLLECTOR_PENDING", "COLLECTOR_APPROVED", "WEBSITE_ADMIN",
      "NITYA_ANNADAN_ADMIN", "TRUSTEE",
    ];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    // Safety 2: Cannot set role to SYSTEM_ADMIN via UI
    if (newRole === "SYSTEM_ADMIN") {
      return res.status(403).json({ success: false, message: "SYSTEM_ADMIN role cannot be assigned via UI. Database level access is required." });
    }

    // Safety 3: Cannot demote or change own account role
    if (id === adminId) {
      return res.status(403).json({ success: false, message: "You cannot change your own role." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Safety 4: Cannot modify another SYSTEM_ADMIN's role
    if (targetUser.role === "SYSTEM_ADMIN") {
      return res.status(403).json({ success: false, message: "Cannot modify a SYSTEM_ADMIN account." });
    }

    const oldRole = targetUser.role;

    // Apply change
    targetUser.role = newRole;
    await targetUser.save();

    // Safety 5: Record in statutory AuditLog
    await AuditLog.create({
      action: "ROLE_CHANGED",
      entity: "User",
      entityId: targetUser._id,
      entityRef: `USER-${targetUser._id.toString().slice(-6).toUpperCase()}`,
      performedBy: adminId,
      performedByName: req.user.name || "System Admin",
      performedByRole: adminRole,
      details: {
        targetUserId: targetUser._id,
        targetUserName: targetUser.name,
        targetUserMobile: targetUser.mobile,
      },
      changes: {
        before: { role: oldRole },
        after: { role: newRole },
      },
      notes: `Role changed from ${oldRole} to ${newRole}`,
    });

    res.json({
      success: true,
      message: "Role updated successfully. User must log out and log back in for changes to take effect.",
      data: {
        userId: targetUser._id,
        newRole,
      }
    });

  } catch (err) {
    console.error("Error changing user role:", err);
    res.status(500).json({ success: false, message: "Failed to change user role" });
  }
};
