/**
 * Migration Script: Add backPleatLength and type fields to existing UserSize documents
 * 
 * Run this script in production to update all existing size documents
 * Usage: node scripts/migrate-user-sizes.js
 */

const mongoose = require('mongoose');

// MongoDB connection string - use your production DB URL
const MONGODB_URI = process.env.MONGODB_URI || 'your-production-mongodb-uri';

const UserSizeSchema = new mongoose.Schema({
  userId: String,
  name: String,
  type: String,
  measurements: {
    chest: String,
    length: String,
    shoulders: String,
    sleeves: String,
    neck: String,
    waist: String,
    backPleatLength: String
  },
  isDefault: Boolean
}, { timestamps: true });

const UserSize = mongoose.model('UserSize', UserSizeSchema);

async function migrateUserSizes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all sizes without backPleatLength or type
    const sizesToUpdate = await UserSize.find({
      $or: [
        { 'measurements.backPleatLength': { $exists: false } },
        { type: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${sizesToUpdate.length} size documents to update`);

    if (sizesToUpdate.length === 0) {
      console.log('✅ All size documents are already up to date!');
      await mongoose.connection.close();
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const size of sizesToUpdate) {
      try {
        // Add missing fields with default values
        const updates = {};
        
        if (!size.type) {
          updates.type = 'general';
        }
        
        if (!size.measurements.backPleatLength) {
          updates['measurements.backPleatLength'] = '0'; // Default value - you can change this
        }

        await UserSize.updateOne(
          { _id: size._id },
          { $set: updates }
        );

        updated++;
        console.log(`✅ Updated size: ${size.name} (${size._id})`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to update size ${size._id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total found: ${sizesToUpdate.length}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);

    await mongoose.connection.close();
    console.log('\n🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserSizes();
