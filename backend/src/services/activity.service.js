const Activity = require("../models/Activity");

const recordActivity = ({ actor, action, message, task, project, metadata }) =>
  Activity.create({ actor, action, message, task, project, metadata });

module.exports = { recordActivity };
