const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define the schema (copy from your model)
const availableDateSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        required: true, 
        unique: true 
    },
    normalSlots: { 
        type: Number, 
        required: true, 
        min: 0,
        default: 4
    },
    emergencySlots: { 
        type: Number, 
        required: true, 
        min: 0,
        default: 1
    },
    emergencySlotCost: { 
        type: Number, 
        required: true, 
        min: 0,
        default: 0
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    normalBookedSlots: { 
        type: Number, 
        default: 0, 
        min: 0 
    },
    emergencyBookedSlots: { 
        type: Number, 
        default: 0, 
        min: 0 
    }
}, {
    timestamps: true
});

const AvailableDate = mongoose.model('AvailableDate', availableDateSchema);

async function migrateEmergencySlotCost() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🔄 Checking for documents without emergencySlotCost...');
        
        // Find all documents that don't have emergencySlotCost field
        const documentsWithoutField = await AvailableDate.find({
            emergencySlotCost: { $exists: false }
        });

        console.log(`📊 Found ${documentsWithoutField.length} documents without emergencySlotCost field`);

        if (documentsWithoutField.length === 0) {
            console.log('✅ All documents already have emergencySlotCost field');
            return;
        }

        console.log('🔄 Updating documents to add emergencySlotCost: 0...');
        
        // Update all documents without the field to have emergencySlotCost: 0
        const result = await AvailableDate.updateMany(
            { emergencySlotCost: { $exists: false } },
            { $set: { emergencySlotCost: 0 } }
        );

        console.log(`✅ Migration completed successfully!`);
        console.log(`   - Documents matched: ${result.matchedCount}`);
        console.log(`   - Documents modified: ${result.modifiedCount}`);

        // Verify the migration
        console.log('🔄 Verifying migration...');
        const allDocs = await AvailableDate.find({});
        const docsWithField = await AvailableDate.find({ emergencySlotCost: { $exists: true } });
        
        console.log(`📊 Total documents: ${allDocs.length}`);
        console.log(`📊 Documents with emergencySlotCost: ${docsWithField.length}`);
        
        if (allDocs.length === docsWithField.length) {
            console.log('✅ Migration verification successful - all documents now have emergencySlotCost field');
        } else {
            console.log('❌ Migration verification failed - some documents still missing the field');
        }

        // Show a sample of the updated documents
        console.log('📋 Sample of updated documents:');
        const sampleDocs = await AvailableDate.find({}).limit(3);
        sampleDocs.forEach((doc, index) => {
            console.log(`   ${index + 1}. Date: ${doc.date.toISOString().split('T')[0]}, Emergency Cost: ${doc.emergencySlotCost}`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        console.log('🔄 Closing database connection...');
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
}

// Run the migration
console.log('🚀 Starting Emergency Slot Cost Migration...');
console.log('📅 Target: Add emergencySlotCost: 0 to all existing available dates');
console.log('');

migrateEmergencySlotCost()
    .then(() => {
        console.log('');
        console.log('🎉 Migration script completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration script failed:', error);
        process.exit(1);
    });