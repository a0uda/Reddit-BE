
import {User} from "../db/models/User.js"; //if error put .js



export async function addNewUser(requestBody){

    const{username,email,password,gender} = requestBody;

    const usernameAvailableResponse = await isUsernameAvailable(username);
    const emailAvailableResponse = await isEmailAvailable(email);

    if(usernameAvailableResponse.success == false)
        return usernameAvailableResponse;
    if(emailAvailableResponse.success == false)
        return emailAvailableResponse;


    const user = new User({username,email,password,gender})
    try
    {
    await user.generateAuthToken();
    await user.save();
    console.log("saving user");
    } catch(error)
    {
        if (error.name === 'ValidationError') {
            // Handle validation errors
            return {succes: false, err: error.message}
        } else {
            // Handle other types of errors
           
            return {succes: false, err: error.message}
        }
    }
   
    return {success: true,user};

}




export async function isUsernameAvailable(username){

const user  = await User.findOne({username})
if(user)
    return { success: false, err: "Username already exists, choose another" };
else
    return { success: true};
}


export async function isEmailAvailable(email){

    const user  = await User.findOne({email})
    if(user)
        return { success: false, err: "Email already exists, choose another" };
    else
        return { success: true};
    }
    


