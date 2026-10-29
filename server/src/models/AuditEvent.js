import mongoose from 'mongoose';
const schema = new mongoose.Schema({orgId:{type:String,index:true},action:String,description:String,submissionId:String,actorName:String,actorRole:String,actorId:String},{timestamps:true});
export default mongoose.model('AuditEvent',schema);
