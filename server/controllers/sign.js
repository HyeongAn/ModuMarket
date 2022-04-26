const User = require('../models/User');
const bcrypt = require("bcrypt");
// const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const user = require('./user');
const saltRounds = 10;

module.exports = {
  up: async (req, res) => {

    let {name, email, password, passwordCheck, age, user_location} = req.body;

    // 빈값이 오면 팅겨내기
    if (!name || !email || !password || !passwordCheck || !age || !user_location) {
      return res.json({message: "정보를 입력하세요"});
    }

    // 비밀번호가 같지 않으면 팅겨내기
    if (password !== passwordCheck) return res.json({ message: "비밀번호가 같지 않습니다"});

    // 이메일 검증
    const sameEmailUser = await User.findOne({ email: email });
    if (sameEmailUser !== null) {
      return res.json({message: "이미 존재하는 이메일입니다"});
    }
    
      // 솔트 생성 및 해쉬화 진행
    bcrypt.genSalt(saltRounds, (err, salt) => {
      // 솔트 생성 실패시
      if (err)
        return res.status(500).json({message: "비밀번호가 안전하지 않습니다."});
      // salt 생성에 성공시 hash 진행

      bcrypt.hash(password, salt, async (err, hash) => {
        if (err)
          return res.status(500).json({message: "비밀번호가 안전하지 않습니다."});

        // 비밀번호를 해쉬된 값으로 대체합니다.
        password = hash;

        const newUser = new User();
        newUser.name = name;
        newUser.email = email;
        newUser.password = password;
        newUser.age = age;
        newUser.user_location = user_location;
      
        // console.log(User)
        newUser.save()
        .then(() => {
          return res.status(201).json({data: newUser._id, message: '회원가입이 완료되었습니다'});
        })
        .catch((err) => { //프론트에서 타입을 다 맞게 보내준다면, 이메일 중복을 여기서 잡아낼 수 있음
          throw new Error(err)
        })
      });
    });
  },

  in: (req, res) => {
    // 로그인할때 이메일, 비밀번호로 회원인지 조회하기 
    User.find({email: req.body.email},(err, data) => {
      if(err) {
        console.log('err !!!!')
        // res.end();
        return res.status(500).json({ error: "서버 오류" });
      }

      if (!data[0]) {
        return res.status(404).json({message: "회원을 찾을 수 없습니다."});
      }

      // if(data[0]){ // 아이디가 일치할때
      //   if(data[0].password === req.body.password){ //비밀번호 확인
      //     console.log("로그인성공")
      //   }else {
      //     console.log("비밀번호 확인해주세요")
      //   }
      // }else { // 아이디가 일치하지않을때
      //   console.log('아이디를 확인해주세요')
      // }

      // console.log(req.body.password)
      // console.log(data.password)
      if (data[0]) {
        const checkPW = () => {
          bcrypt.compare(req.body.password, data[0].password, (error, isMatch) => {
            // console.log(error)
            // console.log(isMatch)
            if (error) {
              return res.status(500).json({ error: error });
            }
            if (isMatch) {
              // 비밀번호가 맞으면 token을 생성해야 합니다.
              // secret 토큰 값은 특정 유저를 감별하는데 사용합니다.
              // console.log(data[0]);
              // delete data[0].password
              // console.log(data[0]);

  
              // acessToken 생성 30s 유효
              const accessToken = jwt.sign(JSON.parse(JSON.stringify(data[0])), process.env.ACCESS_SECRET, {expiresIn: '2h'});
              // refreshToken 생성 2h 유효
              const refreshToken = jwt.sign(JSON.parse(JSON.stringify(data[0])), process.env.REFRESH_SECRET, {expiresIn: '14d'});

              // 해당 유저에게 token값 할당 후 저장
              data[0].refreshToken = refreshToken;
              // console.log(data[0])
              data[0].save((error, data) => {
                if (error) {
                  return res.status(400).json({ error: "something wrong" });
                }
  
                // DB에 token 저장한 후에는 cookie에 토큰을 저장하여 이용자를 식별합니다.
                return res
                  .cookie("refreshToken", data.refreshToken, {
                    maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
                    httpOnly: true,
                  })
                  .status(200)
                  .json({ data: {accessToken: accessToken}, message: "로그인에 성공하였습니다."});
              });
            } else {
              return res.status(403).json({message: "이메일이나 비밀번호가 틀립니다."});
            }
          });
        };
        checkPW();
      }
    })
  },

  out: (req, res) => {
    // 리프레시 토큰을 null로 주고 accessToken도 비워준다.
    delete user.refreshToken;

    res.cookie('refreshToken',null,{ httpOnly: true}).send({accessToken: null, message: "로그아웃이 완료되었습니다."})
  },
}