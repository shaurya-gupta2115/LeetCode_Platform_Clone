const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")

const adminMiddleware = async (req,res,next)=>{

    try{

        const {token} = req.cookies;
        if(!token)
            throw new Error("Token is not persent");

        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(payload.role!='admin')
            throw new Error("Invalid Token");

        if(!result){
            throw new Error("User Doesn't Exist");
        }

        // Redis ke blockList mein persent toh nahi hai

        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result = result;


        next();
    }
    catch(err){
        res.status(401).send("Error: "+ err.message)
    }

}


module.exports = adminMiddleware;




//fetching data from the external api and using that for the implementation in another api 

APPROACH -1


///
const axios = require("axios");
const createProblem = async (req, res) => {
  try {
    // ✅ Step 1: Fetch data from external API (e.g., languages)
    const response = await axios.get("https://external.api.com/languages");
    const languagesArray = response.data;

    // ✅ Step 2: Use that array to validate incoming problem data
    const { referenceSolution } = req.body;

    for (const { language } of referenceSolution) {
      const found = languagesArray.find((lang) => lang.language === language);
      if (!found) {
        return res.status(400).send(`Unsupported language: ${language}`);
      }
    }

    // ✅ Step 3: Proceed with rest of your logic (createProblem)
    res.status(201).send("Problem Created Successfully");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};
///




APPROACH -2

///
const redisClient = require("../config/redis");

const getCachedLanguages = async () => {
  const cached = await redisClient.get("languagesList");
  if (cached) return JSON.parse(cached);

  const response = await axios.get("https://external.api.com/languages");
  await redisClient.set("languagesList", JSON.stringify(response.data), { EX: 3600 });
  return response.data;
};
///


APPROACH -3 :

/// 
Background sync with CRON 

const cron = require('node-cron');
cron.schedule('0 * * * *', async () => {
  const response = await axios.get("https://external.api.com/languages");
  await redisClient.set("languagesList", JSON.stringify(response.data));
});

///






userSubmission -> submitCode 

const Problem = require("./models/problem");
const { getLanguageById, submitBatch } = require("./utils/problemUtility");
const Submission = require("./models/submission");

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    const { code, language } = req.body;

    const languageId = getLanguageById(language);

    if (!userId || !code || !problemId || !language)
      return res.status(500).send("Fields are missing");

    // to get all the hidden test cases we are doing this by fetching problem the Problem DB
    const problem = await Problem.findById(problemId);

    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length,
    });

    // now we can submit code to judge0 api

    const submissions = problem.hiddenTestCases.map((testcase) => ({
        source_code: code,
        language_id: language,
        stdin: testcase.input,
        expected_output: testcase.output
    }))

    const sumbitResult = await submitBatch(submissions) // give the array ok objects containing tokens
    const resultToken = sumbitResult.map((tokenObject) => tokenObject.token)
    const testResult = await submitToken(resultToken);


    //submitted result ko update krna hai 

    let testCasesPassed =0
    let runtime = 0;
    let memory = 0;
    let status = "pending"
    let errorMessage = null;


    for(const test of testResult){ // we are traversing each hidden testCase and it has some value configurations when they are runned at the judge0 api end 

        if(test.status_id ==3){
            testCasesPassed++;
            runtime = runtime+parseFloat(test.time)
            memory = Math.max(memory, test.memory)
        }
        else{
            if(test.status_id >= 4){
                status = "error",
                errorMessage = test.stderr
            }
        }
    }

    //Store the result in Database in Submission
    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save() // this will up date the value in the database of the "Submission"


  } catch (error) {
    res.status(500).send("Internal Server Error " + err);

  }
};

