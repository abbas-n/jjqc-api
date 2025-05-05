const axios = require('axios');
const https = require('https');
const xml2js = require('xml2js');

class AdobeApiModel {
  constructor() {
    this.apiUrl = "https://class.jtehran.com/api/xml?";
    this.domainUrl = "https://class.jtehran.com";
    this.userName = process.env.adobeUser;
    this.userPass = process.env.adobePass;
    this.sessionCookie = null;
    this.learnersGroupPId = 11019;

    // Axios instance with SSL verification disabled
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
      withCredentials: true,
    });
  }

  async parseXML(xmlString) {
    const parser = new xml2js.Parser();
    return await parser.parseStringPromise(xmlString);
  }

  async fileGetContent(url, additionalHeaders = {}) {
    try {
      const headers = this.sessionCookie
        ? { Cookie: this.sessionCookie, ...additionalHeaders }
        : additionalHeaders;

      const response = await this.axiosInstance.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error("Error in fileGetContent:", error);
      throw error;
    }
  }

  async loginToAdobeAsAdmin() {
    const url = `${this.apiUrl}action=login&login=${this.userName}&password=${this.userPass}`;

    try {
      const response = await this.axiosInstance.get(url);
      const setCookieHeader = response.headers['set-cookie'];

      if (!setCookieHeader || !setCookieHeader.length) {
        throw new Error('Login failed: No Set-Cookie header in response');
      }

      // Extract session cookie (BREEZESESSION)
      const sessionCookie = setCookieHeader.find((cookie) => cookie.startsWith('BREEZESESSION'));
      if (!sessionCookie) {
        throw new Error('Login failed: BREEZESESSION cookie not found');
      }

      this.sessionCookie = sessionCookie.split(';')[0]; // Extract only the cookie value

      // Parse response for status
      const parsedResponse = await this.parseXML(response.data);
      if (parsedResponse.results.status[0].$.code !== 'ok') {
        throw new Error('Login failed: ' + JSON.stringify(parsedResponse.results));
      } else {
        const csrfToken = parsedResponse.results.OWASP_CSRFTOKEN?.[0]?.token?.[0];
        this.session = csrfToken;
      }
    } catch (error) {
      console.error('Error in loginToAdobeAsAdmin:', error);
      throw error;
    }
  }

  async loginToAdobeOtherUsers(userName, userPass) {
    const url = `${this.apiUrl}action=login&login=${userName}&password=${userPass}`;

    try {
      const response = await this.axiosInstance.get(url);
      const setCookieHeader = response.headers['set-cookie'];

      if (!setCookieHeader || !setCookieHeader.length) {
        throw new Error('Login failed: No Set-Cookie header in response');
      }

      // Extract session cookie (BREEZESESSION)
      const sessionCookie = setCookieHeader.find((cookie) => cookie.startsWith('BREEZESESSION'));
      if (!sessionCookie) {
        throw new Error('Login failed: BREEZESESSION cookie not found');
      }

      this.sessionCookie = sessionCookie.split(';')[0]; // Extract only the cookie value

      // Parse response for status
      const parsedResponse = await this.parseXML(response.data);
      if (parsedResponse.results.status[0].$.code !== 'ok') {
        throw new Error('Login failed: ' + JSON.stringify(parsedResponse.results));
      } else {
        const csrfToken = parsedResponse.results.OWASP_CSRFTOKEN?.[0]?.token?.[0];
        this.session = csrfToken;
      }
    } catch (error) {
      console.error('Error in loginToAdobeAsAdmin:', error);
      throw error;
    }
  }
  async getCommonInfo() {
    const url = `${this.apiUrl}action=common-info`;
    const response = await this.fileGetContent(url);
    return await this.parseXML(response);
  }

  async getUserPrincipalID(userName) {
    const url = `${this.apiUrl}action=principal-list&filter-name=${encodeURIComponent(userName)}`;
    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    if (!parsedResponse['principal-list'] || !parsedResponse['principal-list'].principal) {
      throw new Error('User not found');
    }

    return parseInt(parsedResponse['principal-list'].principal[0]['principal-id'][0]);
  }


  async createMeeting(meetingName, meetingUrl) {
    const folderScoID = await this.getScos();
    const url = `${this.apiUrl}action=sco-update&type=meeting&name=${meetingName}&folder-id=${folderScoID}&date-begin=${new Date().toISOString()}&date-end=${new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()}&url-path=${meetingUrl}`;

    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    const scoID = parsedResponse.sco['sco-id'][0];

    // Set permissions for the meeting
    const permissionsUrlPublic = `${this.apiUrl}action=permissions-update&acl-id=${scoID}&principal-id=public-access&permission-id=view-hidden`;
    await this.fileGetContent(permissionsUrlPublic);

    const permissionsUrlHost = `${this.apiUrl}action=permissions-update&principal-id=${this.learnersGroupPId}&acl-id=${scoID}&permission-id=host`;
    await this.fileGetContent(permissionsUrlHost);

    return scoID;
  }

  //---------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------

  async getScos(folderName) {
    const url = `${this.apiUrl}action=sco-shortcuts&session=${this.session}`;

    // ارسال درخواست و دریافت پاسخ
    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    // بررسی وضعیت پاسخ
    if (parsedResponse.results.status[0].$.code !== 'ok') {
      throw new Error('Error in getScos: ' + JSON.stringify(parsedResponse.results));
    }
    // جستجوی فولدر بر اساس نام
    const shortcuts = parsedResponse.results.shortcuts[0].sco;
    const folder = shortcuts.find(shortcut => shortcut.$['type'] === folderName);

    if (!folder) {
      throw new Error(`Folder "${folderName}" not found in sco-shortcuts.`);
    }

    // شناسه فولدر مورد نظر
    const folderScoId = folder.$['sco-id'];
    return folderScoId;
  }

  async getScosFromContents(parentFolderScoId, folderName) {
    const url = `${this.apiUrl}action=sco-contents&sco-id=${parentFolderScoId}&session=${this.session}`;

    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    if (parsedResponse.results.status[0].$.code !== 'ok') {
      throw new Error('Error in getScosFromContents: ' + JSON.stringify(parsedResponse.results));
    }


    const items = parsedResponse.results.scos[0].sco;
    const folder = items.find(item => item.name[0] === folderName);

    if (!folder) {
      throw new Error(`Folder "${folderName}" not found in sco-contents.`);
    }

    return folder.$['sco-id'];
  }


  async createFolder(folderName, parentFolderScoId) {
    const url = `${this.apiUrl}action=sco-update&type=folder&name=${encodeURIComponent(folderName)}&folder-id=${parentFolderScoId}&session=${this.session}`;

    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    if (parsedResponse.results.status[0].$.code !== 'ok') {
      throw new Error('Error in createFolder: ' + JSON.stringify(parsedResponse.results));
    }

    return parsedResponse.results.sco[0].$['sco-id'];
  }

  async createMeetingInFolder(meetingName, meetingUrl, parentFolderScoId) {
    const url = `${this.apiUrl}action=sco-update&type=meeting&name=${encodeURIComponent(meetingName)}&folder-id=${parentFolderScoId}&url-path=${encodeURIComponent(meetingUrl)}&date-begin=${new Date().toISOString()}&date-end=${new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()}&session=${this.session}`;

    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    // console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));
    if (parsedResponse.results.status[0].$.code !== 'ok') {
      throw new Error('Error in createMeeting: ' + JSON.stringify(parsedResponse.results));
    }

    // console.log('Meeting created with url-path:', parsedResponse.results.sco[0]['url-path'][0]);
    // console.log('Meeting created with sco-id:', parsedResponse.results.sco[0].$['sco-id']);
    return { 'sco-id': parsedResponse.results.sco[0].$['sco-id'], 'url-path': parsedResponse.results.sco[0]['url-path'][0] };
  }

  async moveRecordingToFolder(recordingScoId, targetFolderScoId) {
    const url = `${this.apiUrl}action=sco-move&sco-id=${recordingScoId}&folder-id=${targetFolderScoId}&session=${this.session}`;
    console.log(url);

    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    if (parsedResponse.results.status[0].$.code !== 'ok') {
      throw new Error('Error in moveRecordingToFolder: ' + JSON.stringify(parsedResponse.results));
    }

    console.log('Recording moved successfully.');
    return true;
  }


  async createUser(firstName, lastName, mobile, email) {
    const url = `${this.apiUrl}action=principal-update&first-name=${firstName}&last-name=${lastName?lastName:'_'}&login=${mobile}&email=${email}&password=${mobile}&type=user&send-email=true&has-children=0`;

    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    if (parsedResponse.results.status[0].$.code !== 'ok') {
      throw new Error('Error in createUser: ' + JSON.stringify(parsedResponse.results));
    }

    if (!parsedResponse.results.principal || !parsedResponse.results.principal[0].$['principal-id']) {
      throw new Error('principal-id not found in response');
    }

    return parsedResponse.results.principal[0].$['principal-id'];
  }


  async addTeacherToMeeting(userID, meetingID) {
    const url = `${this.apiUrl}action=permissions-update&principal-id=${userID}&acl-id=${meetingID}&permission-id=host`;
    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);
  }

  async addParticipantToMeeting(userID, meetingID) {
    const url = `${this.apiUrl}action=permissions-update&principal-id=${userID}&acl-id=${meetingID}&permission-id=view`;
    await this.fileGetContent(url);
  }


  async loginToMeetingAsHost(userName, pass, meeting) {
    return `${this.domainUrl}${meeting}?login=${userName}&password=${pass}`;
  }

  async loginToMeetingAsParticipant(meetingURL) {
    return `${this.domainUrl}${meetingURL}`;
  }

  async getRecordingFilesData(scoId) {
    const url = `${this.apiUrl}action=sco-contents&sco-id=${scoId}`;
    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);
    if (parsedResponse.results.status[0].$.code !== 'ok') {
      throw new Error('Error in createUser: ' + JSON.stringify(parsedResponse.results));
    }
    // console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));
    let recordingRS = parsedResponse.results.scos[0].sco;
    const filteredData = recordingRS.filter(item => item["$"].icon === "archive" && item["$"].duration);// get the video recordings
    const scoIds = filteredData.map(item => item["$"]["sco-id"]);
    for (const scoId of scoIds) {
      await this.setScoToPublic(scoId);
    }
    return filteredData;
    // return scoIds; 
  }

  async setScoToPublic(scoId) {
    const url = `${this.apiUrl}action=permissions-update&principal-id=public-access&acl-id=${scoId}&permission-id=view`;
    console.log(url);
    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);
  }
  async setScoToPrivate(scoId) {
    const url = `${this.apiUrl}action=permissions-update&principal-id=public-access&acl-id=${scoId}&permission-id=remove`;
    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);
  }

  async getMeetingRecordings(meetingScoId) {
    try {
      const url = `${this.apiUrl}action=report-meeting-recordings&sco-id=${meetingScoId}&session=${this.session}`;
      const response = await this.fileGetContent(url);
      const parsedResponse = await this.parseXML(response);
      console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));

      if (!parsedResponse || !parsedResponse.results || !parsedResponse.results.recording) {
        console.log('No recordings found for this meeting.');
        return [];
      }

      const recordings = parsedResponse.results.recording.map((recording) => ({
        name: recording.name[0],
        url: `${this.domainUrl}${recording['url-path'][0]}`,
        startTime: recording['date-created'][0],
        duration: recording['duration'][0],
      }));

      console.log('Recordings:', recordings);
      return recordings;
    } catch (error) {
      console.error('Error fetching recordings:', error);
      throw error;
    }
  }

  async checkAndEndMeeting(meetingID) {
    try {
      // Step 1: Check meeting status using sco-info
      const checkUrl = `${this.apiUrl}action=sco-info&sco-id=${meetingID}`;
      const response = await this.fileGetContent(checkUrl);
      const parsedResponse = await this.parseXML(response);

      // Parse the sco-info response to check if the meeting exists and its status
      // console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));
      const status = parsedResponse.results.status[0].$?.code;
      if (status !== 'ok') {
        console.log('Meeting does not exist or is invalid');
        return { success: false, message: 'Meeting does not exist or is invalid' };
      }
      
      // Step 2: End the meeting using meeting-end
      const endUrl = `${this.apiUrl}action=meeting-end&meeting-id=${meetingID}`;
      const endResponse = await this.fileGetContent(endUrl);
      const parsedEndResponse = await this.parseXML(endResponse);
      
      // console.log('Parsed Response:', JSON.stringify(parsedEndResponse, null, 2));
      const endStatus = parsedEndResponse.results.status[0].$?.code;
      if (endStatus === 'ok') {
        console.log('Meeting ended successfully');
        return { success: true, message: 'Meeting ended successfully' };
      } else {
        console.log('Failed to end the meeting');
        return { success: false, message: 'Failed to end the meeting' };
      }
    } catch (error) {
      console.error('Error in checkAndEndMeeting:', error);
      return { success: false, message: 'An error occurred', error: error.message };
    }
  }


  async getHostMeeting() {
    const url = `${this.apiUrl}action=report-my-meetings`;
    const response = await this.fileGetContent(url);
    const parsedResponse = await this.parseXML(response);

    return `https://${parsedResponse['my-meetings'].meeting[0]['domain-name'][0]}${parsedResponse['my-meetings'].meeting[0]['url-path'][0]}`;
  }
}

module.exports = AdobeApiModel;
