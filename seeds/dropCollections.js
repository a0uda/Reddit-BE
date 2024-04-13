import mongoose from 'mongoose';

// community_name Howe_and_Sons

const url = "mongodb+srv://ahmedabdelgawad011:BackendReddit@cluster0.workift.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

async function dropCollections() {
    try {
        console.log("Conneting to db")
        await mongoose.connect(url);
        console.log("Connected to db")

        console.log("The collections are")
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(collections);

        for (const { name } of collections) {
            if (name === 'tokens') {
                console.log('Skipping tokens collection');
                continue;
            }

            console.log(`Dropping collection: ${name}`);
            await mongoose.connection.collection(name).drop();
        }

    } catch (error) {
        console.error('Error dropping collections:', error);
    } finally {
        mongoose.connection.close();
    }
}

dropCollections();