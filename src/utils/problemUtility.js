const axios = require("axios");

const getLanguageById = (lang) => {
  const language = {
    "c++": 54,
    java: 62,
    javascript: 63,
  };

  return language[lang.toLowerCase()]; // language id for judge0 api return krdega
};

const submitBatch = async (submissions) => {
  const options = {
    method: "POST",
    url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
    params: {
      base64_encoded: "false",
    },
    headers: {
      "x-rapidapi-key": process.env.JUDGE0_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: {
      submissions,
    },
  };

  async function fetchData() {
    try {
      const response = await axios.request(options); //jo bhi options ki request type hai like post, get, etc. uske according request bhejega
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  return await fetchData();
};

// what we didi till is that we have done a batch submission and in return it gives us array of tokens for each input result which
// we need to send again to judge0 api to get the result of each submission
// aur jo token aenge wo ", " se separate hoke bhejenge judge0 api ko

const waiting = async (timer) => {
  setTimeout(() => {
    return 1;
  }, timer);
};

// ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

const submitToken = async (resultToken) => {
  const options = {
    method: "GET",
    url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
    params: {
      tokens: resultToken.join(","), // jo resultToken array hai usko join karke string me convert krdo
      base64_encoded: "false",
      fields: "*",
    },
    headers: {
      "x-rapidapi-key": process.env.JUDGE0_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  //object -> submission : [array of response from tokens {}, {}, {}]
  // jab tak result nahi aata tab tak wait karte raho
  while (true) {
    const result = await fetchData();

    const IsResultObtained = result.submissions.every((r) => r.status_id > 2);

    if (IsResultObtained) return result.submissions;

    await waiting(1000);
  }
};

module.exports = { getLanguageById, submitBatch, submitToken };

