import mongoose from 'mongoose';
const findingSchema = new mongoose.Schema({
 title:String, reason:String, kind:String, severity:{type:String,enum:['low','medium','high'],default:'medium'}, confidence:{type:Number,default:0.8}, matchedText:String, suggestion:String, sourceId:String, sourceText:String, action:String, editedText:String, dismissReason:String
},{_id:true});
const versionSchema = new mongoose.Schema({text:String,createdAt:{type:Date,default:Date.now},createdBy:String},{_id:false});
const commentSchema = new mongoose.Schema({text:String,authorName:String,authorRole:String,createdAt:{type:Date,default:Date.now}},{_id:true});
const submissionSchema = new mongoose.Schema({
 orgId:{type:String,required:true,index:true}, creatorId:String, creatorName:String, title:{type:String,required:true}, text:{type:String,required:true}, contentType:{type:String,default:'social_post'}, status:{type:String,default:'draft',enum:['draft','in_review','approved','changes_requested']}, findings:[findingSchema], versions:[versionSchema], comments:[commentSchema], reviewerId:String
},{timestamps:true});
export default mongoose.model('Submission',submissionSchema);
