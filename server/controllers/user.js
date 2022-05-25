const User = require('../models/User');
const { Post } = require('../models/Post');
const Application = require('../models/Application');
const jwt = require('jsonwebtoken');
const { uploadFile, deleteFile } = require('../s3');
const fs = require('fs');
const util = require('util');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const unlinkFile = util.promisify(fs.unlink);

module.exports = {
  location: (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);

    //req.body.area_name으로 프론트쪽에서 현재api주소를 보내주면 .. 
    //토큰에 있는 area_name과 비교하여 status 값 보내주기
    // 로그인을 한 직후라 accTokenData가 무조건 있으므로 한가지토큰이 없는 경우는 구현하지않아도됨

    const { area_name } = accTokenData
    if (req.body.area_name === area_name) {
      res.status(200).json({ data: null, message: '동네인증이 완료되었습니다' })
    } else {
      res.status(401).json({ data: null, message: '나의 동네가 아닙니다' })
    }
  },

  mypage: async (req, res) => {
    // accessToken으로 유저정보 가져오기  || accessToken이 만료돼고 refreshToken
    if (!req.headers.authorization) {
      return res.status(401).json({ data: null, message: 'invalid access token' })
    }
    if (!req.cookies.refreshToken) {
      return res.status(401).json({ data: null, message: 'refresh token not provided' })
    }

    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

    if (accTokenData && refTokenData) {
      const userinfo = await User.findOne({ email: accTokenData.email }).exec();
      const { _id, name, email, age, area_name, user_image } = userinfo
      res.status(200).json({ data: { userInfo: { id: _id, name, email, age, area_name, user_image } }, message: 'ok' })
    }
    if (accTokenData && !refTokenData) {
      const userinfo = await User.findOne({ email: accTokenData.email }).exec();
      const { _id, name, email, age, area_name, user_image } = userinfo
      const refreshToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.REFRESH_SECRET, { expiresIn: '14d' });

      res
        .cookie("refreshToken", refreshToken, {
          maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
          httpOnly: true,
        })
        .status(200)
        .json({ data: { userInfo: { id: _id, name, email, age, area_name, user_image } }, message: 'ok' });

    }
    if (!accTokenData && refTokenData) {
      const userinfo = await User.findOne({ email: refTokenData.email }).exec();
      const { _id, name, email, age, area_name, user_image } = userinfo
      const accessToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.ACCESS_SECRET, { expiresIn: '2h' });
      return res.send({ data: { accessToken, userInfo: { id: _id, name, email, age, area_name, user_image } }, message: "ok" })
    }
    if (!accTokenData && !refTokenData) {
      res.status(404).send({ "data": null, "message": "access and refresh token has been tempered" })
    }
  },

  auth: async (req, res) => { // 바디에 패스워드가 온다고한다 .. 

    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

    // accTokenData,refTokenData 둘다 있는 경우 
    if (accTokenData && refTokenData) {
      const { email } = accTokenData
      try {
        const result = await User.findOne({ email: email }).exec();
        console.log(result.password);
        console.log(req.body.password);
        if (result.password === req.body.password) {
          res.status(200).json({ data: null, message: '인증이 완료되었습니다' });
        } else {
          res.status(404).json({ data: null, message: '비밀번호가 일치하지않습니다' });
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

      const result = await User.findOne({ email: email }).exec();
      if (result.password === req.body.password) {
        const { _id, email, area_name } = result
        const accessToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.ACCESS_SECRET, { expiresIn: '2h' });
        res.status(200).json({ data: { accessToken }, message: '인증이 완료되었습니다' });
      } else {
        res.status(204).json({ data: null, message: '비밀번호가 일치하지않습니다' });
      }
    }

    // accTokenData만 있는 경우 
    if (accTokenData && !refTokenData) {
      const { email } = accTokenData
      const result = await User.findOne({ email: email }).exec();
      if (result.password === req.body.password) {
        const { _id, email, area_name } = result
        const refreshToken = jwt.sign(JSON.parse(JSON.stringify({
          _id, name, email, password, age, area_name
        })), process.env.REFRESH_SECRET, { expiresIn: '14d' });

        res
          .cookie("refreshToken", refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
            httpOnly: true,
          })
          .status(200)
          .json({ data: null, message: "로그인에 성공하였습니다." });

      } else {
        res.status(404).json({ data: null, message: '비밀번호가 일치하지않습니다' });
      }
    }

    // 둘다 없는 경우 
    if (!accTokenData && !refTokenData) {
      return res.status(404).json({ data: null, message: "access and refresh token has been tempered" })
    }
  },

  changeInfo: async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

    if (accTokenData && refTokenData) {
      const { _id } = accTokenData;
      if (req.body.password || req.body.area_name) {
        bcrypt.genSalt(saltRounds, (err, salt) => {
          // 솔트 생성 실패시
          if (err)
            return res.status(500).json({ message: "비밀번호가 안전하지 않습니다." });
          // salt 생성에 성공시 hash 진행
          if (!req.body.password) {
            const result = User.findByIdAndUpdate(_id, { $set: { area_name: req.body.area_name } }, { new: true })
            if (result) {
              res.status(200).json({ data: null, message: '동네 재인증 완료' });
            } else {
              res.status(404).json({ data: null, message: '동네 재인증 실패' });
            }

          } else {
            bcrypt.hash(req.body.password, salt, async (err, hash) => {
              if (err)
                // console.log('에러나는 진짜 이유')
                return res.status(500).json({ message: "비밀번호가 안전하지 않습니다." });

              // 비밀번호를 해쉬된 값으로 대체합니다.
              password = hash;

              // console.log(User)
              const result = await User.findByIdAndUpdate(_id, { $set: { password: hash, area_name: req.body.area_name } }, { new: true })
              if (result) {
                res.status(200).json({ data: null, message: '회원정보 수정이 완료 되었습니다' });
              } else {
                res.status(500).json({ data: null, message: 'server error' });
              }
            })
          }
        })
      } else {
        res.status(404).json({ data: null, message: '회원정보 수정란을 입력해주세요' });
      }
    }

    else if (!accTokenData && refTokenData) {
      const { _id } = refTokenData;
      const result = await User.findOne({ _id }).exec();
      if (refTokenData) {
        const { _id, email, area_name } = result
        const accessToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.ACCESS_SECRET, { expiresIn: '2h' });

        if (req.body.password || req.body.area_name) {
          const result = await User.findByIdAndUpdate(_id, { $set: { password: req.body.password, area_name: req.body.area_name } }, { new: true })
          if (result) {
            res.status(200).json({ data: { accessToken }, message: '회원정보 수정이 완료 되었습니다' });
          } else {
            res.status(500).json({ data: null, message: 'server error' });
          }
        }
        res.status(404).json({ data: { accessToken }, message: '회원정보 수정란을 입력해주세요' });
      }
    }

    else if (accTokenData && !refTokenData) {
      const { _id } = accTokenData;
      const result = await User.findOne({ _id }).exec();
      if (accTokenData) {
        const { _id, email, area_name } = result
        const refreshToken = jwt.sign(JSON.parse(JSON.stringify({
          _id, email, area_name
        })), process.env.REFRESH_SECRET, { expiresIn: '14d' });

        if (req.body.password || req.body.area_name) {
          const result = await User.findByIdAndUpdate(_id, { $set: { password: req.body.password, area_name: req.body.area_name } }, { new: true })
          if (result) {
            res.status(200)
              .cookie("refreshToken", refreshToken, {
                maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
                httpOnly: true,
              })
              .json({ data: null, message: '회원정보 수정이 완료 되었습니다' });
          } else {
            res.status(500).json({ data: null, message: 'server error' });
          }
        }
        res.status(404)
          .cookie("refreshToken", refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
            httpOnly: true,
          })
          .json({ data: null, message: '회원정보 수정란을 입력해주세요' });
      }
    }

    else if (!accTokenData && !refTokenData) {
      res.status(404).json({ data: null, message: "access and refresh token has been tempered" })
    }
  },

  passwordCheck: (req, res) => {
    console.log(req.body);

    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

    if (accTokenData && refTokenData) {
      const { _id } = accTokenData;
      User.findOne({ _id: _id }, (err, data) => {
        if (err) {
          return res.status(500).json({ message: "서버 오류" });
        }
        // 이메일 일치할 경우 비밀번호 확인하기
        if (data) {
          console.log(data);
          const checkPW = () => {
            //복호화 
            bcrypt.compare(req.body.password, data.password, (err, isMatch) => {
              if (err) {
                return res.status(500).json({ message: "서버 오류" });
              }
              // 비밀번호가 일치할 경우 
              if (isMatch) {
                res.status(200).json({ message: "비밀번호가 일치합니다." });
              }
              else {
                return res.status(401).json({ message: "비밀번호를 일치하지 않습니다." });
              }
            });
          };
          checkPW();
        }
        // 이메일이 일치하지않을 경우 
      })
    }
  },

  uploadImage: async (req, res) => {
    console.log(req.file);

    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

    console.log('예전꺼 찍혀야함!!!!!')
    console.log(req.body.formerImage)
    if (accTokenData && refTokenData) {
      const { _id } = accTokenData;
      if (!req.body.formerImage || !req.file) {
        res.status(404).json({ message: '수정사항이 없습니다. 이미지를 선택해주세요' })
      } else {
        await uploadFile(req.file);
        if (req.body.formerImage !== 'default') {
          await deleteFile(req.body.formerImage);
        }
        await unlinkFile(req.file.path);
        const userData = await User.findByIdAndUpdate(_id, { $set: { user_image: req.file.filename } }, { new: true }).exec();
        console.log('새로운거 와야함!!!!!')
        console.log(userData.user_image)
        res.status(200).json({ data: userData.user_image });
      }
    }

    // const result1 = await uploadFile(req.file);
    // await unlinkFile(req.file.path)
    // // console.log(result1);

    // await User.updateOne({ email: req.params.email }, { $set: { user_image: req.file.path } })

    // const result = await User.findOne({ email: req.body.email }).exec();

    // res.send({ imagePath: `/:email/image/${result1.key}` })
    // res.send('1')

    // uploadImage.save()
    // .then(() => {
    //   return res.status(200).json({data: uploadImage, message: '이미지가 정상적으로 등록되었습니다.'});
    // })
    // .catch((err) => { //프론트에서 타입을 다 맞게 보내준다면, 이메일 중복을 여기서 잡아낼 수 있음
    //   throw new Error(err)
    // })

  },

  // getImage: async (req, res) => {
  //   console.log(req.params)
  //   const result = await User.findOne({ email: req.params.email }).select("user_image").exec();

  //   res.send(result);
  // },

  deleteInfo: async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; //Bearer
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET); // 토큰을 해독해 유저 데이터를 리턴
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);
    if (accTokenData) {
      const { email } = accTokenData
      const result = await User.deleteOne({ email })
      if (result.deletedCount === 1) {
        res.status(200).json({ data: null, message: '회원탈퇴가 완료 되었습니다' });
      } else {
        res.status(404).json({ data: null, message: '잘못된 요청입니다' });
      }
    }
    else if (refTokenData) {
      const { email } = refTokenData
      const result = await User.deleteOne({ email })
      if (result.deletedCount === 1) {
        res.status(200).json({ data: null, message: '회원탈퇴가 완료 되었습니다' });
      } else {
        res.status(404).json({ data: null, message: '잘못된 요청입니다' });
      }
    }
    if (!accTokenData && !refTokenData) {
      return res.status(404).json({ data: null, message: "access and refresh token has been tempered" })
    }
  },

  writePost: async (req, res) => { //내가 작성한 공고글
    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);
    //    const Post = require('../models/Post');
    // 토큰에서 유저 아이디 겟잇해서
    // post 컬렉션에서 userId로 필터링해서 가져오기 
    if (accTokenData && refTokenData) {
      const { _id } = accTokenData
      try {

        await Post.updateMany({ endtime: { $lt: Date.now() } }, { isvalid: true })
        const result = await Post.find({ userId: _id }).exec();
        // console.log(result)
        if (result.length > 0) { //내가 작성한 공고글이 있을때
          res.status(200).json({ data: result, message: 'list fetch success' });
        } else { //내가 작성한 공고글이 없을때
          res.status(204).json({ data: null, message: 'it does not exist' });
        }
      }
      catch (err) {
        console.error(err);
        // res.status(501).json({data : null, message: 'server error'});
      }
    }
    if (!accTokenData && refTokenData) {
      const { email } = refTokenData
      const userdata = await User.findOne({ email })
      if (refTokenData) {
        const { _id, email, area_name } = userdata
        const accessToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.ACCESS_SECRET, { expiresIn: '2h' });

        // 포스트 컬렉션에서 내가 작성한 공고글이 있는지 조회
        await Post.updateMany({ endtime: { $lt: Date.now() } }, { isvalid: true })
        const result = await Post.find({ userId: _id }).exec();
        if (result.length > 0) { //내가 작성한 공고글이 있을때
          res.status(200).json({ data: { result, accessToken }, message: 'list fetch success' });
        } else { //내가 작성한 공고글이 없을때
          res.status(204).json({ data: { accessToken }, message: 'it does not exist' });
        }
      }
    }
    if (accTokenData && !refTokenData) {
      const { email } = accTokenData
      const userdata = await User.findOne({ email })
      if (accTokenData) {
        const { _id, email, area_name } = userdata
        const refreshToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.REFRESH_SECRET, { expiresIn: '14d' });

        // 포스트 컬렉션에서 내가 작성한 공고글이 있는지 조회
        await Post.updateMany({ endtime: { $lt: Date.now() } }, { isvalid: true })
        const result = await Post.find({ userId: _id }).exec();
        if (result.length > 0) { //내가 작성한 공고글이 있을때
          res.status(200).json({ data: result, message: 'list fetch success' });
        } else { //내가 작성한 공고글이 없을때
          res
            .cookie("refreshToken", refreshToken, {
              maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
              httpOnly: true,
            })
            .status(204).json({ data: null, message: 'it does not exist' });
        }
      }
    }
    if (!accTokenData && !refTokenData) {
      return res.status(404).json({ data: null, message: "access and refresh token has been tempered" })
    }
  },

  participatePost: async (req, res) => { //내가 참가한 공고글 
    const token = req.headers.authorization.split(' ')[1];
    const accTokenData = jwt.verify(token, process.env.ACCESS_SECRET);
    const refTokenData = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET);

    // 토큰에서 유저 아이디 겟잇해서
    // application컬렉션에서 userId가 일치하고 isapplied상태가 true인것 필터링해서 해당 글의 post_id만 매핑하여 전달하기
    if (accTokenData && refTokenData) {
      const { _id } = accTokenData
      await Post.updateMany({ endtime: { $lt: Date.now() } }, { isvalid: true })
      const result = await Application.find({ user_id: _id, isapplied: true }).populate('post_id').exec();
      if (result.length > 0) {
        const postresult = result.map((data) => {
          return data.post_id;
        })
        res.status(200).json({ data: postresult, message: 'list fetch success' });
      } else {
        res.status(204).json({ data: null, message: 'it does not exist' });
      }
    }
    if (!accTokenData && refTokenData) {
      const { email } = refTokenData
      const userdata = await User.findOne({ email })
      if (refTokenData) {
        const { _id, email, area_name } = userdata
        const accessToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.ACCESS_SECRET, { expiresIn: '2h' });

        await Post.updateMany({ endtime: { $lt: Date.now() } }, { isvalid: true })
        const result = await Application.find({ user_id: _id, isapplied: true }).populate('post_id').exec();
        if (result.length > 0) {
          const postresult = result.map((data) => {
            return data.post_id;
          })
          res.status(200).json({ data: { accessToken, postresult }, message: 'list fetch success' });
        } else {
          res.status(204).json({ data: { accessToken }, message: 'it does not exist' });
        }
      }
    }
    if (accTokenData && !refTokenData) {
      const { email } = accTokenData
      const userdata = await User.findOne({ email })
      if (accTokenData) {
        const { _id, email, area_name } = userdata
        const refreshToken = jwt.sign(JSON.parse(JSON.stringify({ _id, email, area_name })), process.env.ACCESS_SECRET, { expiresIn: '2h' });

        await Post.updateMany({ endtime: { $lt: Date.now() } }, { isvalid: true })
        const result = await Application.find({ user_id: _id, isapplied: true }).populate('post_id').exec();
        if (result.length > 0) {
          const postresult = result.map((data) => {
            return data.post_id;
          })
          res.status(200)
            .cookie("refreshToken", refreshToken, {
              maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
              httpOnly: true,
            })
            .json({ data: postresult, message: 'list fetch success' });
        } else {
          res.status(204)
            .cookie("refreshToken", refreshToken, {
              maxAge: 1000 * 60 * 60 * 24 * 14, // 쿠키 유효시간: 14일
              httpOnly: true,
            })
            .json({ data: null, message: 'it does not exist' });
        }
      }
    }
    if (!accTokenData && !refTokenData) {
      return res.status(404).json({ data: null, message: "access and refresh token has been tempered" })
    }

  }
};
