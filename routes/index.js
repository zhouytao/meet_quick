var express = require('express');
var router = express.Router();
var wechat = require('wechat');
var api = require('../wechat/wechat_api.js');
var config = require('../profile.json');
var fs = require('fs');

var request = require('request');

var gm = require('gm').subClass({ imageMagick: true });

var menu = JSON.stringify(require('../menu.json'));
api.createMenu(menu, function (err, result) { });

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

var Customer = require(config.models_factary)("customer");

router.get('/meetconfig', wechat(config, function (req, res, next) { }));
router.post('/meetconfig', wechat(config, function (req, res, next) {

  console.log("消息判断和事件响应");

  var message = req.weixin;
  console.log(message);

  switch (message.MsgType) {
    case "text": {
      if (message.Content === 'diaosi') {
        res.reply('hehe');
      } else if (message.Content === 'getUserList') {
        (async () => {
          let openids = await getFollower();
          let alldatas = await getBatchGetUsers(openids);
          await customer_create(alldatas);
        })().then(() => {
          res.reply('保存成功');
        }).catch(() => {
          res.reply('保存失败');
        })
      }
      else if (message.Content === 'qr') {

        var qr_path = config.path_wechat + message.FromUserName + message.CreateTime + '.png';
        var a_path = config.path_wechat + 'a.jpg';
        var b_path = config.path_wechat + 'b.jpg';
        var c_path = config.path_wechat + 'c.png';
        var qr_path_out_resize = config.path_wechat + message.FromUserName + message.CreateTime + '_out1.png';
        var qr_path_out = config.path_wechat + message.FromUserName + message.CreateTime + '_out2.png';

        (async () => {
          let tmpQRCodeURL = await getTmpQRCodeURL();
          let getDownTmpQRCode = await downTmpQRCode(qr_path, tmpQRCodeURL);
          await gmResize(qr_path, qr_path_out_resize);
          await gmComposite(a_path, qr_path_out_resize, qr_path_out);
          let media_id = await douploadMedia(qr_path_out);
        })().then(() => {
          res.reply({
            type: "image",
            content: {
              mediaId: result.media_id
            }
          });
        }).catch(() => {
          res.reply('获取二维码失败');
        })

        // api.createTmpQRCode("x", 100, function (err, data, response) {
        //   console.log(data);
        //   var qucodemedia = api.showQRCodeURL(data.ticket);
        //   console.log("showQRCodeURL:" + qucodemedia);
        //   var qr_path = config.path_wechat + message.FromUserName + message.CreateTime + '.png';
        //   var a_path = config.path_wechat + 'a.jpg';
        //   var b_path = config.path_wechat + 'b.jpg';
        //   var c_path = config.path_wechat + 'c.png';
        //   var qr_path_out_resize = config.path_wechat + message.FromUserName + message.CreateTime + '_out1.png';
        //   var qr_path_out = config.path_wechat + message.FromUserName + message.CreateTime + '_out2.png';

        //   //测试用
        //   // var fileReadStream = fs.createReadStream(a_path);

        //   var fileWriteStream = fs.createWriteStream(qr_path);
        //   console.log("qr_path:" + qr_path);
        //   request(qucodemedia).pipe(fileWriteStream);
        //   // fileReadStream.pipe(fileWriteStream);
        //   fileWriteStream.on('close', function () {
        //     console.log('copy over');


        //     gm(qr_path)
        //       .resize(126, 126)
        //       .noProfile()
        //       .write(qr_path_out_resize, function (err) {
        //         if (!err) console.log('done');


        //         gm(a_path)
        //           .composite(qr_path_out_resize)
        //           .geometry('+130+67')
        //           .write(qr_path_out, function (err) {
        //             if (!err) console.log("Written composite image.");

        //             api.uploadMedia(qr_path_out, "image", function (err, result) {

        //               // gm(a_path)
        //               //   .resize(480, 240)
        //               //   .noProfile()
        //               //   .write(qr_path_out, function (err) {
        //               //     console.log(err);
        //               //     if (!err) console.log('done');
        //               //   });

        //               // gm(a_path)
        //               //   .composite(b_path)
        //               //   .geometry('+100+150')
        //               //   .write(qr_path_out, function (err) {
        //               //     if (!err) console.log("Written composite image.");
        //               //   });

        //               console.log("result:" + result);
        //               console.log("err:" + err);
        //               res.reply({
        //                 type: "image",
        //                 content: {
        //                   mediaId: result.media_id
        //                 }
        //               });
        //             });
        //           });
        //       });
        //   });
        // });
      }
      else if (message.Content === 'hehe') {
        // 回复音乐
        res.reply({
          type: "music",
          content: {
            title: "来段音乐吧",
            description: "一无所有",
            musicUrl: "http://mp3.com/xx.mp3",
            hqMusicUrl: "http://mp3.com/xx.mp3",
            thumbMediaId: "thisThumbMediaId"
          }
        });
      }
      else {
        //图文回复
        res.reply([
          {
            title: 'meet_test_shell',
            description: 'meet_test_shell',
            picurl: 'http://nodeapi.cloudfoundry.com/qrcode.jpg',
            url: 'http://www.yangtz.com'
          }
        ]);
      }
    }; break;
    case "event": {
      switch (message.Event) {
        case "subscribe": {
          res.reply('subscribe');
          api.getUser(message.FromUserName, function (err, data, res) {
            for (key in data) {
              console.log(key + ":" + data[key]); // { errcode: 0, errmsg: 'ok' }
            }
          });
        }; break;
        case "unsubscribe": {
          res.reply('unsubscribe');
        }; break;
        case "SCAN": {
          res.reply('感谢您关注米特学院，么么哒，目前该功能还不完善，更多功能需要和彭老师一起定制哟' + message.EventKey);
        }; break;
      }
    }; break;
  }
}));

function getFollower() {
  return new Promise((resolve, reject) => {
    api.getFollowers(function (err, data, response) {
      if (err) {
        console.log("获取关注用户数据失败:" + err);
        reject(err);
      }
      else {
        console.log("获取关注用户数据成功:");
        resolve(data.data.openid);
      }
    });
  });
};

function getBatchGetUsers(openids) {
  return new Promise((resolve, reject) => {
    api.batchGetUsers(openids, function (err, data, responses) {
      if (err) {
        console.log("批量获取数据失败:" + err);
        reject(err);
      }
      else {
        console.log("批量获取数据成功:");
        resolve(data["user_info_list"]);
      }
    });
  });
};

function customer_create(alldatas) {
  return new Promise((resolve, reject) => {
    Customer.create(alldatas, function (err, response) {
      if (err) {
        console.log("保存失败:" + err);
        reject(err);
      }
      else {
        // console.log("保存成功:" + response);
        resolve(true);
      }
    });
  });
}

function getTmpQRCodeURL() {
  return new Promise((resolve, reject) => {
    api.createTmpQRCode("x", 100, function (err, data, response) {
      if (err) {
        console.log("获取二维码信息失败:" + err);
        reject(err);
      }
      else {
        let qucodemedia = api.showQRCodeURL(data.ticket);
        console.log("showQRCodeURL:" + qucodemedia);
        resolve(qucodemedia);
      }
    });
  })
}

function downTmpQRCode(qr_path, qucodemedia) {
  return new Promise((resolve, reject) => {
    var fileWriteStream = fs.createWriteStream(qr_path);
    request(qucodemedia).pipe(fileWriteStream);
    fileWriteStream.on('close', function (err) {
      console.log('copy over');
    });
    resolve("down");
  });
}

function gmResize(qr_path, qr_path_out_resize) {
  return new Promise((resolve, reject) => {
    gm(qr_path)
      .resize(126, 126)
      .noProfile()
      .write(qr_path_out_resize, function (err) {
        if (err) {
          console.log("图片裁剪失败:" + err);
          reject(err);
        }
        else {
          console.log("图片裁剪成功");
        }
      });
  })
}

function gmComposite(a_path, qr_path_out_resize, qr_path_out) {
  return new Promise((resolve, reject) => {
    gm(a_path)
      .composite(qr_path_out_resize)
      .geometry('+130+67')
      .write(qr_path_out, function (err) {
        if (err) {
          console.log("图片合成失败:" + err);
          reject(err);
        }
        else {
          console.log("图片合成成功");
        }
      });
  })
}

function douploadMedia(qr_path_out) {
  return new Promise((resolve, reject) => {
    api.uploadMedia(qr_path_out, "image", function (err, result) {
      if (err) {
        console.log("图片上传失败:" + err);
        reject(err);
      }
      else {
        console.log("图片上传成功:");
        resolve(result.media_id);
      }
    });
  })
}


module.exports = router;