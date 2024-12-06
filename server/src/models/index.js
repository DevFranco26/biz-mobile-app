// src/models/index.js

import User from './Users.js';
import Company from './Company.js';
import Location from './Location.js';
import TimeLogs from './TimeLogs.js';
import UserSettings from './UserSettings.js';

// Define Associations

// User <-> Company
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

// User <-> Location
User.hasMany(Location, { foreignKey: 'adminId', as: 'locations' });
Location.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

// User <-> TimeLogs
User.hasMany(TimeLogs, { foreignKey: 'userId', as: 'timeLogs' });
TimeLogs.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserSettings <-> User and Location
UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserSettings, { foreignKey: 'userId', as: 'settings' });

UserSettings.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Location.hasMany(UserSettings, { foreignKey: 'locationId', as: 'userSettings' });

export {
  User,
  Company,
  Location,
  TimeLogs,
  UserSettings,
};
