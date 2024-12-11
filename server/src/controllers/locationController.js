import Location from '../models/Location.js';
import User from '../models/Users.js';

export const createLocation = async (req, res) => {
  const adminId = req.user?.id;
  const { label, latitude, longitude, radius } = req.body;

  if (!adminId) {
    return res.status(401).json({ message: 'Unauthorized: Admin ID not found.' });
  }
  if (!label || !latitude || !longitude || !radius) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const location = await Location.create({
      adminId,
      label,
      latitude,
      longitude,
      radius,
    });

    await location.reload({
      include: [
        { model: User, as: 'admin', attributes: ['id', 'email', 'companyId'] },
        { model: User, as: 'lastEditor', attributes: ['id', 'email'] }
      ]
    });

    console.log('createLocation - Created location:', location.toJSON());
    res.status(201).json({ message: 'Location created successfully.', data: location });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getLocations = async (req, res) => {
  try {
    console.log('getLocations - req.user:', req.user);
    const { companyId } = req.user;
    if (!companyId) {
      console.log('getLocations - No companyId in req.user');
      return res.status(400).json({ message: 'Company ID is required.' });
    }

    // Only fetch locations where the admin user is in the same company
    const locations = await Location.findAll({
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'email', 'companyId'],
          required: true,
          where: { companyId } // Filter by the same companyId
        },
        {
          model: User,
          as: 'lastEditor',
          attributes: ['id', 'email'],
          required: false
        }
      ]
    });

    console.log('getLocations - Found locations:', locations.map(loc => ({
      id: loc.id,
      label: loc.label,
      adminEmail: loc.admin?.email,
      adminCompanyId: loc.admin?.companyId
    })));

    res.status(200).json({ message: 'Locations retrieved successfully.', data: locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateLocation = async (req, res) => {
  const { locationId } = req.params;
  const { label, latitude, longitude, radius } = req.body;

  try {
    console.log('UpdateLocation - req.user:', req.user);

    const location = await Location.findByPk(locationId, {
      include: { model: User, as: 'admin' }
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found.' });
    }

    const { companyId, id: userId } = req.user;
    console.log('UpdateLocation - userId:', userId, 'companyId:', companyId);

    const adminUser = await User.findOne({ where: { id: location.adminId } });
    if (!adminUser || adminUser.companyId !== companyId) {
      return res.status(403).json({ message: 'Forbidden: Different company.' });
    }

    await location.update({ label, latitude, longitude, radius, updatedBy: userId });
    await location.reload({
      include: [
        { model: User, as: 'admin', attributes: ['id', 'email', 'companyId'] },
        { model: User, as: 'lastEditor', attributes: ['id', 'email'] }
      ]
    });

    console.log('Updated Location after reload:', location.toJSON());
    res.status(200).json({ message: 'Location updated successfully.', data: location });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteLocation = async (req, res) => {
  const { locationId } = req.params;

  try {
    const location = await Location.findByPk(locationId);

    if (!location) {
      return res.status(404).json({ message: 'Location not found.' });
    }

    if (location.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this location.' });
    }

    await location.destroy();
    console.log('deleteLocation - Deleted location id:', locationId);

    res.status(200).json({ message: 'Location deleted successfully.' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
