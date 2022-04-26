const User = require('../models/User');
const jwt = require('jsonwebtoken');

module.exports = {
    mypage: async (req, res) => {
    // accessToken으로 유저정보 가져오기  || accessToken이 만료돼고 refreshToken
      if (!req.headers.authorization) {
        return res.status(401).json({data: null, message: 'invalid access token'})
      }
      if (!req.cookies.refreshToken) {
        return res.status(401).json({data: null, message: 'refresh token not provided'})
      }

      const token = req.headers.authorization.split(' ')[1]; //Bearer
      const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET); // 토큰을 해독해 유저 데이터를 리턴
      const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

      if (accTokenData && refTokenData) {
        const userinfo = await User.findOne({ email: accTokenData.email }).exec();
        const {_id, name, email, age, area_name, user_location, user_image} = userinfo
        res.status(200).json({data: {_id, name, email, age, area_name, user_location, user_image}, message: 'ok'})
      }
      if (accTokenData && !refTokenData) {
        const userinfo = await User.findOne({ email: accTokenData.email }).exec();
        const {_id, name, email, age, area_name, user_location, user_image} = userinfo
        const refreshToken = jwt.sign(JSON.parse(JSON.stringify({_id, name, email, age, area_name, user_location, user_image})), process.env.REFRESH_SECRET, {expiresIn: '14d'});

        userinfo.refreshToken = refreshToken; 
        userinfo.save((err, data) => {
        if (err) {
          return res.status(500).json({ message: "서버 오류" });
        }
        return res
          .cookie("refreshToken", refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
            httpOnly: true,
          })
          .status(200)
          .json({data: {userinfo: {_id, name, email, age, area_name, user_location, user_image}}});
        });
      }
      if (!accTokenData && refTokenData) {
        const userinfo = await User.findOne({ email: refTokenData.email }).exec();
        const {_id, name, email, age, area_name, user_location, user_image} = userinfo
        const accessToken = jwt.sign(JSON.parse(JSON.stringify({_id, name, email, age, area_name, user_location, user_image})), process.env.ACCESS_SECRET);
        return res.send({data: {accessToken: accessToken, userInfo: userinfo}, message: "ok"})
      }
      if (!accTokenData && !refTokenData) {
        res.status(404).send({ "data": null, "message": "access and refresh token has been tempered" })
      }
    },

    auth: async (req, res) => { // 바디에 패스워드가 온다고한다 .. 

        const token = req.headers.authorization.split(' ')[1]; //Bearer
        const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET); // 토큰을 해독해 유저 데이터를 리턴
        const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

        // accTokenData,refTokenData 둘다 있는 경우 
        if (accTokenData && refTokenData) {
          const { email } = accTokenData
          try {
            const result =  await User.findOne({ email: email }).exec();
            if(result.password === req.body.password){
                res.status(200).json({data : null, message: '인증이 완료되었습니다'});
            } else {
                res.status(404).json({data : null, message: '비밀번호가 일치하지않습니다'});
            }
          }
          catch (err) {
                console.error(err);
                // res.status(501).json({data : null, message: 'server error'});
          }
        }

        // refTokenData만 있는 경우 
        if (!accTokenData && refTokenData) {
          const { email } = refTokenData

          const result =  await User.findOne({ email: email }).exec();
          if(result.password === req.body.password){
              const {_id, name, email, age, area_name, user_location, user_image} = result
              const accessToken = jwt.sign(JSON.parse(JSON.stringify({_id, name, email, age, area_name, user_location, user_image})), process.env.ACCESS_SECRET);
              res.status(200).json({data : {accessToken}, message: '인증이 완료되었습니다'});
          } else {
              res.status(404).json({data : null, message: '비밀번호가 일치하지않습니다'});
          }
        }

        // accTokenData만 있는 경우 
        if (accTokenData && !refTokenData) {
          const { email } = accTokenData
          const result =  await User.findOne({ email: email }).exec();
          if(result.password === req.body.password){
              const {_id, name, email, age, area_name, user_location, user_image} = result
              const refreshToken = jwt.sign(JSON.parse(JSON.stringify({
                _id, name, email, age, area_name, user_location, user_image
                })), process.env.REFRESH_SECRET, {expiresIn: '14d'});

              result.refreshToken = refreshToken; 
              result.save((err, data) => {
              if (err) {
                return res.status(500).json({ message: "서버 오류" });
              }
              return res
                .cookie("refreshToken", refreshToken, {
                  maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
                  httpOnly: true,
                })
                .status(200)
                .json({ data: {accessToken}, message: "로그인에 성공하였습니다."});
              });
          } else {
              res.status(404).json({data : null, message: '비밀번호가 일치하지않습니다'});
          }
        }

        // 둘다 없는 경우 
        if (!accTokenData && !refTokenData) {
            return res.status(404).json({ data: null, message: "access and refresh token has been tempered" })
        }
    },

    changeInfo: (req, res) => {
      // 사는곳 수정은 인증으로 대체 .. 
        res.send('b')
    },

    deleteInfo: async (req, res) => {
        const token = req.headers.authorization.split(' ')[1]; //Bearer
        const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET); // 토큰을 해독해 유저 데이터를 리턴
        const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);
        if(accTokenData){
          const { email } = accTokenData
          const result = await User.deleteOne({email})
          if(result.deletedCount === 1){
              res.status(200).json({data : null, message: '회원탈퇴가 완료 되었습니다'});
          } else {
              res.status(404).json({data : null, message: '잘못된 요청입니다'});
          }
        }
        if(refTokenData){
          const { email } = refTokenData
          const result = await User.deleteOne({email})
          if(result.deletedCount === 1){
              res.status(200).json({data : null, message: '회원탈퇴가 완료 되었습니다'});
          } else {
              res.status(404).json({data : null, message: '잘못된 요청입니다'});
          }
        }
        if (!accTokenData && !refTokenData) {
            return res.status(404).json({ data: null, message: "access and refresh token has been tempered" })
        }
    }
};
