const express = require("express");
const app = express();
app.use(express.json());
const SolutionVideo = require("../models/solutionVideo");

const {
  getLanguageById,
  submitBatch,
  submitToken,
} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");

const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator,
  } = req.body;

  try {
    // referenace solution is an array of objects to hum use traverse karenge and uske according hr language and uska code ke upr loop hoga for ke through
    for (const { language, completeCode } of referenceSolution) {
      // jo bhi instant language hai uska id lena hai
      const languageId = getLanguageById(language);

      // console.log("referenceSolution ===>", referenceSolution);
      // console.log("visibleTestCases ===>", visibleTestCases);
      // console.log("getLanguageById(language) ===>", getLanguageById(language));

      // Instead giving single single test cases, i am creating Batch submission
      const submissions = visibleTestCases.map((testcase) => ({
        // ye visible hr ek testcase ko uthaenge and process krega
        language_id: languageId, // c++ hai
        source_code: completeCode, // c++ ka code hai
        stdin: testcase.input, // single input daal diya
        expected_output: testcase.output, // single output daal diya
      }));

      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      //submitResult token ka array hai jo ki humne batch submission me bheja tha aur jo token aenge wo as an object aenge in the array
      const resultToken = submitResult.map((value) => value.token); // [{token: "token value"},{},{}] => [ token , token , token]

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      // resultToken ko hum fir se bhejenge judge0 api ko to get the result of each submission
      const testResult = await submitToken(resultToken);

      console.log(testResult);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).send("Error Occured - not success");
        }
      }
    }

    // We can store it in our DB

    const userProblem = await Problem.create({
      ...req.body,
      problemCreator: req.result._id,
    });

    res.status(201).send("Problem Saved Successfully");
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const updateProblem = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator,
  } = req.body;

  try {
    if (!id) {
      return res.status(400).send("Missing ID Field");
    }

    const DsaProblem = await Problem.findById(id);
    if (!DsaProblem) {
      return res.status(404).send("ID is not persent in server");
    }

    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language);

      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value) => value.token); // [{token: .....},{token: .....},{token: .....},{token: .....},]

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      const testResult = await submitToken(resultToken);
      //  console.log(testResult);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).send("Error Occured");
        }
      }
    }

    const newProblem = await Problem.findByIdAndUpdate(
      id,
      { $set: { ...req.body } }, //object spread operator json -> object me convert krega and that converted object is then updated in the database --> direct bhi ...req.body likh skte the
      { runValidators: true, new: true } // jo bhi validators hote hai models me unhe bhi run karana haii to runValidators ko true krdo
    );
    res.status(200).send(newProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).send("ID is Missing ");

    const deletedProblem = await Problem.findByIdAndDelete(id);

    if (!deletedProblem) return res.status(404).send("Problem is Missing");

    res.status(200).send("Successfully Deleted");
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select(
      "_id title description difficulty tags visibleTestCases startCode referenceSolution"
    );

    if (!getProblem) return res.status(404).send("Problem is Missing");

    // video ka jo bhi url wagera le aao

    if (!getProblem) return res.status(404).send("Problem is Missing");

    const videos = await SolutionVideo.findOne({ problemId: id });

    // if (videos) {
    //   getProblem.secureUrl = videos.secureUrl;
    //   getProblem.cloudinaryPublicId = videos.cloudinaryPublicId;
    //   getProblem.thumbnailUrl = videos.thumbnailUrl;
    //   getProblem.duration = videos.duration;

    //   return res.status(200).send(getProblem);
    // }


    //debugging done here...since there was problem with the Model ...we havent created secureUrl,cloudinary etc things as attributes of the problems so for that if we give attributes to them then they are not goind to show up in the database and hence they will be undefined when we do fetch the attibutes via props drillings
    // to isko humne debug kiya getproblem ko ek object me create krke and uske sath baaki attributes like secureUrl , thumbnailUrl, duration wagairah sb kuchhh set krdiya and send kiya responseData ki trh ...

    // yaad rakhne wali baat ye hai ki jo bhi hum send kr rhe hai responseData usme videos ke hone pr hai lekin hume tb ka bhi sochkr chlna hai agar video na hua to ...us case me bhi hume return krna pdega ...bs getProblemById krke hi bhale ..
    
    if (videos) {
      const responseData = {
        ...getProblem.toObject(),
        secureUrl: videos.secureUrl,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
      };

      return res.status(200).send(responseData);
    }

    return res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const getAllProblem = async (req, res) => {
  try {
    const getProblem = await Problem.find({}).select(
      "_id title difficulty tags"
    );

    if (getProblem.length == 0)
      return res.status(404).send("Problems are Missing");

    res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

//Pagination implementation concept

// const page = 2;
// const limit = 10;
// const skip = (page - 1)*limit;   skip -> initial se kitni values hatanihai
// Problem.find().skip(skip).limit(limit)

const solvedAllProblembyUser = async (req, res) => {
  try {
    const userId = req.result._id;

    const user = await User.findById(userId).populate({
      path: "problemSolved",
      select: "_id title difficulty tags",
    });

    res.status(200).send(user.problemSolved);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;

    const ans = await Submission.find({ userId, problemId });

    if (ans.length == 0)
      res.status(200).send("No Submission is made for this problem");

    res.status(200).send(ans);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
};
