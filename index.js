const express = require("express");
const axios = require("axios");

const jwt = require("jsonwebtoken");
const { twitterClient } = require("./twitterClient.js");
require("dotenv").config();
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Tüm kaynaklara izin vermek için
  // res.header('Access-Control-Allow-Origin', 'http://example.com'); // Belirli bir kaynağa izin vermek için
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const PORT = process.env.PORT || 4000;
const secretKey = process.env.SECRET_KEY;
const validEmails = process.env.VALID_EMAILS.split(",");

app.use(express.json());

app.post("/api/login", (req, res) => {
  // Kullanıcı bilgileri
  const email = req.body.email;
  const password = req.body.password;
  if (!validEmails.includes(email)) {
    return res.status(401).json({ message: "Invalid email" });
  }

  // Basit bir doğrulama, gerçek bir veritabanı kullanılmalıdır
  if (validEmails.includes(email) && password === "password") {
    // JWT üretimi
    const token = jwt.sign({ email }, secretKey);
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// CheckToken API
app.post("/api/checkToken", (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // JWT'nin geçerliliği kontrol edildi, decoded içinde JWT'nin içeriği bulunmaktadır.
    // Burada dilediğiniz ek kontrolleri yapabilirsiniz, örneğin JWT'nin expire süresini kontrol edebilirsiniz.

    res.json({ isValid: true });
  });
});

const internalCheckToken = async (req, res, next) => {
  const token = req.headers.authorization;

  // Token var mı kontrol et
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token not provided" });
  }

  try {
    // Token doğrula
    const response = await axios.post("http://localhost:4000/api/checkToken", {
      token,
    });

    // Token geçerli mi kontrol et
    if (!response.data.isValid) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Token geçerliyse, bir sonraki middleware'e devam et
    next();
  } catch (error) {
    console.error("Token check error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const internalParaphrasing = async (req, res, next) => {
  console.log("asdasdasdasd");
  console.log(req.body);
  console.log("asdasdasdasd");
  const twitText = req.body.twitText;

  const opts = {
    method: "POST",
    url: "https://rewriter-paraphraser-text-changer-multi-language.p.rapidapi.com/rewrite",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": "e4e4e8f5f3msh8f6ed623b25b8afp1cdc6fjsn9e23d85293dd",
      "X-RapidAPI-Host":
        "rewriter-paraphraser-text-changer-multi-language.p.rapidapi.com",
    },
    data: {
      language: "tr",
      strength: 3,
      text: twitText,
    },
  };

  try {
    const response = await axios.request(opts);
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }

  // try {
  //   // Token doğrula
  //   const response = await axios.post("http://localhost:4000/api/checkToken", {
  //     token,
  //   });

  //   // Token geçerli mi kontrol et
  //   if (!response.data.isValid) {
  //     return res.status(401).json({ success: false, message: "Invalid token" });
  //   }

  //   // Token geçerliyse, bir sonraki middleware'e devam et
  //   next();
  // } catch (error) {
  //   console.error("Token check error:", error);
  //   return res
  //     .status(500)
  //     .json({ success: false, message: "Internal server error" });
  // }
};

// const internalReadTweet = async () => {
//   try {
//     let res = await twitterClient.v2.tweetLikedBy("1777609059480273081");
//     console.log({ res });
//     return res;
//   } catch (e) {
//     console.log(e);
//   }
// };

// app.post("/api/readTweet", internalCheckToken, (req, res) => {
//   const twitUrl = req.body.twitUrl;

//   let res2 = internalReadTweet();
//   console.log({ twitUrl });
//   console.log({ res2 });
//   res.json({ isValid: true });
// });

///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D
///// THERE IS NO READ TWEET FUNCTON YET :D

app.post("/api/readTextTweet", internalCheckToken, async (req, res) => {
  let result = await internalParaphrasing(req, res);

  if (result) {
    res.json({ twitText: result.rewrite });
  }
});

app.post("/api/makeTweet", internalCheckToken, async (req, res) => {
  const tweet = req.body.tweet;

  try {
    await twitterClient.v2.tweet(tweet);

    return res.json({ isSuccess: true });
  } catch (e) {
    console.log(e);
    return res.json({ isSuccess: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
