const keyId=process.env.RAZORPAY_KEY_ID;
const keySecret=process.env.RAZORPAY_KEY_SECRET;
if(!keyId||!keySecret){console.error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET first.");process.exit(1);}
const plans=[
  {name:"Commerce OS Basic",amount:500000},
  {name:"Commerce OS Plus",amount:1500000},
  {name:"Commerce OS Pro",amount:2000000},
];
for(const plan of plans){
  const response=await fetch("https://api.razorpay.com/v1/plans",{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,"Content-Type":"application/json"},body:JSON.stringify({period:"monthly",interval:1,item:{name:plan.name,amount:plan.amount,currency:"INR",description:`${plan.name} managed commerce plan`}})});
  const data=await response.json();
  if(!response.ok){console.error(`${plan.name}: ${data.error?.description||"provider request failed"}`);process.exitCode=1;continue;}
  console.log(`${plan.name}: ${data.id}`);
}
