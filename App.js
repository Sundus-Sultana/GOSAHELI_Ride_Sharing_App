import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LandingActivity from './src/PaseengerScreens/LandingActivity';
import Signup from './src/PaseengerScreens/Signup';
import Login from './src/PaseengerScreens/Login';
import ForgotPassword from './src/PaseengerScreens/ForgotPassword';
import Home from './src/PaseengerScreens/Home';
import about from './src/PaseengerScreens/about';
import Support from './src/PaseengerScreens/Support';
import Favourite from './src/PaseengerScreens/Favourite';
import Offers from './src/PaseengerScreens/Offers';
import History from './src/PaseengerScreens/History';
import Profile from './src/PaseengerScreens/Profile';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LandingActivity">
        <Stack.Screen name="LandingActivity" component={LandingActivity} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} /> 
        <Stack.Screen name="Home" component={Home} screenOptions={{ animation: 'slide_from_right', }} />
        <Stack.Screen name="History" component={History}/>
        <Stack.Screen name="Favourite" component={Favourite}/>
        <Stack.Screen name="Offers" component={Offers}/>
        <Stack.Screen name="Profile" component={Profile}/>
        <Stack.Screen name="about" component={about} />
        <Stack.Screen name="Support" component={Support}/>


      </Stack.Navigator>
    </NavigationContainer>
  );
}