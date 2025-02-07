import NextAuth from "next-auth";
import { client } from "./sanity/lib/client";
import bcrypt from "bcryptjs";
export const {handlers,signIn,signOut,auth} = NextAuth({

    providers:[
        {
            id:"credentials",
            name:"Credentials",
            type:"credentials",
            credentials:{
                email:{label:"Email",type:"email"},
                password:{label:"Password",type:"password"},
                
            },
            async authorize(credentials){
                try{
                    const user = await client.fetch(
                        `*[_type == "user" && email == $email && role == $role ][0]`,
                        {email:credentials.email}
                    );

                    if(!user) return null;
                    const isValid = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    return isValid ? {
                        id:user._id,
                        email:user.email,
                        name:user.name,
                        role:user.role
                    }:null;
                }catch(error){
                    console.error("Authorization error:",error);
                    return null;
                }
            }
        }
    ]
})