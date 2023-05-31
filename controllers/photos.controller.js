const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const pattern = new RegExp(/^[a-zA-Z0-9_.-]*$/, 'g');
      const emailPattern = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'g');

      const authorMatch = author.match(pattern);
      const titleMatch = title.match(pattern);
      const emailMatch = email.match(emailPattern);

      if(authorMatch != author) throw new Error('Wrong author mate!')
      if(titleMatch != title) throw new Error('Wrong title mate!')
      if(emailMatch != email) { 
        throw new Error('Wrong email mate!')
      }

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if(fileExt === 'png' || fileExt === 'jpg' || fileExt === 'gif') {
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
      } else {
        throw new Error('Wrong file extension');
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const ip = req.clientIp;
    const userIp = await Voter.findOne({ user: ip})
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });

    if(userIp) {

      if(userIp.votes.includes(photoToUpdate._id)) {
        res.status(500).json({message: 'You have already voted on this photo' });
      }  else {
        userIp.votes.push(photoToUpdate._id);
        await userIp.save();
        photoToUpdate.votes++; 
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }

    } else {
      const newVoter = new Voter({user: ip, votes: [photoToUpdate._id]})
      await newVoter.save(); 
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
