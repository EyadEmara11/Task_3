import Joi from 'joi';
import mongoose from 'mongoose';
import { Perk } from '../models/Perk.js';

// validation schema for creating/updating a perk
const perkSchema = Joi.object({
  // check that title is at least 2 characters long, and required
  title: Joi.string().min(2).required(),
  // description is optional
  description: Joi.string().allow(''),
  // category must be one of the defined values, default to 'other'
  category: Joi.string().valid('food','tech','travel','fitness','other').default('other'),
  // discountPercent must be between 0 and 100, default to 0
  discountPercent: Joi.number().min(0).max(100).default(0),
  // merchant is optional
  merchant: Joi.string().allow(''),
  ccreatedBy: Joi.forbidden(),

}); 

  

// Filter perks by exact title match if title query parameter is provided 
export async function filterPerks(req, res, next) {
  try {
    const { title } = req.query     ;
    if (title) {
      const perks = await Perk.find ({ title: title}).sort({ createdAt: -1 });
      console.log(perks);
      res.status(200).json(perks)
    }
    else {
      res.status(400).json({ message: 'Title query parameter is required' });
    }
  } catch (err) { next(err); }
}

// get all perks
export async function getAllPerks(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const perks = await Perk
      .find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ perks }); // <-- match frontend shape
  } catch (err) {
    next(err);
  }
}

// Get all perks in the database (not filtered by user) with optional search and filter
export async function getAllPerksPublic(req, res, next) {
  try {
    // Extract query parameters for search and filter
    const { search, merchant } = req.query;
    
    // Build query object dynamically
    let query = {};
    
    // If search parameter exists, search by title (case-insensitive)
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }
    
    // If merchant parameter exists, filter by exact merchant name
    if (merchant && merchant.trim()) {
      query.merchant = merchant.trim();
    }
    
    // Fetch perks without populate first to check for invalid ObjectIds
    const perks = await Perk
      .find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Separate perks into those with valid ObjectIds and those without
    const perksWithValidIds = [];
    const perksWithInvalidIds = [];

    for (const perk of perks) {
      if (perk.createdBy && mongoose.Types.ObjectId.isValid(perk.createdBy)) {
        perksWithValidIds.push(perk._id);
      } else {
        // Set createdBy to null for invalid ObjectIds
        perksWithInvalidIds.push({ ...perk, createdBy: null });
      }
    }

    // Populate only perks with valid ObjectIds
    let populatedPerks = [];
    if (perksWithValidIds.length > 0) {
      populatedPerks = await Perk
        .find({ _id: { $in: perksWithValidIds } })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Combine valid populated perks with invalid ones (with createdBy set to null)
    const allPerks = [...populatedPerks, ...perksWithInvalidIds];
    
    // Sort by createdAt again since we combined arrays
    allPerks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ perks: allPerks });
  } catch (err) {
    next(err);
  }
}

// Get a single perk by ID 
export async function getPerk(req, res, next) {
  try {
    const perk = await Perk.findById(req.params.id);
    console.log(perk);
    if (!perk) return res.status(404).json({ message: 'Perk not found' });
    res.json({ perk });
    // next() is used to pass errors to the error handling middleware
  } catch (err) { next(err); }
}

// Create a new perk
export async function createPerk(req, res, next) {
  try {
    // validate request body against schema\
    const { value, error } = perkSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    // ...value spreads the validated fields
    const doc = await Perk.create({ ...value,createdBy: req.user.id});
    res.status(201).json({ perk: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Duplicate perk for this merchant' });
    next(err);
  }
}

// Update an existing perk by ID and validate only the fields that are being updated (might be the task)
export async function updatePerk(req, res, next) {
  try {

    // i want to validate only the fields that are being updated  ? shall i find the existing perk first and then merge the updates with it before validating ?
    // find the existing perk first and then merge the updates with it before validating
    const existingPerk = await Perk.findById(req.params.id,);
    if (!existingPerk) return res.status(404).json({ message: 'Perk not found' });
    // merge existing perk with updates
    const updatedData = { ...existingPerk.toObject(), ...req.body };
    const { value, error } = perkSchema.validate(updatedData, { abortEarly: false, stripUnknown: true, convert: true });

    // const { value, error } = perkSchema.validate(req.body , {abortEarly:false, stripUnknown:true, convert:true });
    if (error) return res.status(400).json({ message: error.message });
    // $set operator is used to update only the fields provided in value
    const doc = await Perk.findByIdAndUpdate(req.params.id, {$set: value}, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Perk not found' });
    res.json({ perk: doc });
  } catch (err) { next(err); }
}
// Delete a perk by ID
export async function deletePerk(req, res, next) {
  try {
    const doc = await Perk.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Perk not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
