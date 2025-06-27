const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");

const submitCode = async (req,res)=>{
   
    // 
    try{
       const userId = req.result._id;
       const problemId = req.params.id;

       let {code,language} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");


      if (language === "cpp") language = "c++";
      console.log(language);


    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
    //    testcases(Hidden) test krne ke liye 

    //   Kya apne submission store kar du pehle....
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
        })

    //    JUDGE0 CODE SUBMISSION STARTS FROM HERE 

    const languageId = getLanguageById(language);

    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));


    const submitResult = await submitBatch(submissions);// this will generate token for further processing 
    
    const resultToken = submitResult.map((value)=> value.token);// the token individually getting extracted from object into array 

    const testResult = await submitToken(resultToken); // these resultToken to sent to the api for getting the results and submitResult is the api function for further processing 

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'pending';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
          status = "accepted"
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = 'wrong'
            errorMessage = test.stderr
          }
          else{
            status = 'error'
            errorMessage = test.stderr
          }
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();
    
    // ProblemId ko insert karenge userSchema ke problemSolved mein if it is not persent there.
    
    // req.result == user Information

    if(!req.result.problemSolved.includes(problemId)){ // agar problem id nhi hai database me jo submit hui ho to save krdo 
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }

    const accepted = status == "accepted";
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory,
    });
       
    }
    catch(err){
      res.status(500).send("Internal Server Error "+ err);
    }

}


const runCode = async(req,res)=>{
    
     // 
     try{
      const userId = req.result._id;
      const problemId = req.params.id;

      let {code,language} = req.body;

     if(!userId||!code||!problemId||!language)
       return res.status(400).send("Some field missing");


     if (language === "cpp") language = "c++";

   //    Fetch the problem from database
      const problem =  await Problem.findById(problemId);
   //    testcases(visible)

   //    Judge0 code ko submit karna hai
   const languageId = getLanguageById(language);

   const submissions = problem.visibleTestCases.map((testcase)=>({
       source_code:code,
       language_id: languageId,
       stdin: testcase.input,
       expected_output: testcase.output
   }));


   const submitResult = await submitBatch(submissions);
   
   const resultToken = submitResult.map((value)=> value.token);

   const testResult = await submitToken(resultToken);
  
   let testCasesPassed = 0;
   let runtime = 0;
   let memory = 0;
   let status = true;
   let errorMessage = null;


   for (const test of testResult) {
     if (test.status_id == 3) {
       testCasesPassed++;
       runtime = runtime + parseFloat(test.time);
       memory = Math.max(memory, test.memory);
     } else {
       if (test.status_id == 4) {
         status = false;
         errorMessage = test.stderr;
       } else {
         status = false;
         errorMessage = test.stderr;
       }
     }
   }


   res.status(201).json({
     success: status,
     testCases: testResult,
     runtime,
     memory,
   });
      

  //  //here we are cleaning the returned output 
  //  const cleanedResult = testResult.map(({post_execution_filesystem,...rest}) => rest);

  // // res.status(201).send(testResult);
  // res.status(201).send(cleanedResult);

      
   }
   catch(err){
     res.status(500).send("Internal Server Error "+ err);
   }
}


module.exports = {submitCode,runCode};



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',


// User.findByIdUpdate({
// })

//const user =  User.findById(id)
// user.firstName = "Mohit";
// await user.save();