const { MongoClient } = require('mongodb');

async function testMedia() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/raphanakai';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('media');

    // Count total items
    const totalCount = await collection.countDocuments();
    console.log(`Total media items: ${totalCount}`);

    // Count by type
    const videoCount = await collection.countDocuments({ fileType: 'video' });
    const photoCount = await collection.countDocuments({ fileType: 'photo' });
    
    console.log(`Videos: ${videoCount}`);
    console.log(`Photos: ${photoCount}`);

    // Get some sample items
    const videos = await collection.find({ fileType: 'video' }).limit(3).toArray();
    const photos = await collection.find({ fileType: 'photo' }).limit(3).toArray();

    console.log('\nSample videos:');
    videos.forEach((v, i) => {
      console.log(`${i + 1}. ${v.title} - ${v.fileUrl}`);
    });

    console.log('\nSample photos:');
    photos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} - ${p.fileUrl}`);
    });

    // Check for items without fileType
    const noType = await collection.countDocuments({ fileType: { $exists: false } });
    console.log(`\nItems without fileType: ${noType}`);

    // Check for other fileType values
    const distinctTypes = await collection.distinct('fileType');
    console.log('\nAll fileType values found:', distinctTypes);

  } finally {
    await client.close();
  }
}

testMedia().catch(console.error);