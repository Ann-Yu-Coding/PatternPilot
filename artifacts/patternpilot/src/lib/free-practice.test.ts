import assert from "node:assert/strict";
import { it } from "node:test";
import { emptyHistory, recordAttempt, type Attempt } from "./practice-history";
import { remainingFree, canOpenPassage, nextPassageId } from "./free-practice";
const a=(id:string,passageId:string):Attempt=>({id,passageId,title:passageId,timestamp:Number(id),score:5,total:8,elapsed:30,misses:[]});
it("counts unique completed passages, keeps retries free and follows seeded order",()=>{
 let h=emptyHistory(); assert.equal(remainingFree(h),2); assert.equal(nextPassageId(h),"set-ecology");
 h=recordAttempt(h,a("1","set-memory")); assert.equal(nextPassageId(h),"set-ecology");
 h=recordAttempt(h,a("2","set-memory")); assert.equal(remainingFree(h),1);
 h=recordAttempt(h,a("3","set-ecology")); assert.equal(remainingFree(h),0);
 assert.equal(canOpenPassage(h,"set-memory"),true); assert.equal(canOpenPassage(h,"set-archaeology"),false);
 assert.equal(nextPassageId(h),"set-archaeology");
});
