import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import SelectDropdown from "react-native-select-dropdown";
import RNCalendarEvents from "react-native-calendar-events";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import styles from "../styles/styles";
import storage from "../storage/storage";
import { createTriggerNotification } from "../functions/createTriggerNotification";
import { cancelNotification } from "../functions/cancelNotification";
import { updateEvent } from "../functions/updateEvent";

const ViewEvent = ({ route, navigation }) => {
  const [index, setIndex] = useState(route.params["key"]);
  const [title, setTitle] = useState(route.params["title"]);
  const [startDate, setStartDate] = useState(new Date(route.params["startDate"]));
  const [endDate, setEndDate] = useState(new Date(route.params["endDate"]));
  const [notifID, setNotifID] = useState(route.params["notifID"]);
  const [eventID, setEventID] = useState(route.params["eventID"]);
  // const [shouldSpeak, setShouldSpeak] = useState(route.params['shouldSpeak']);
  // const [message, setMessage] = useState(route.params['message']);
  const [repeat, setRepeat] = useState(route.params["repeat"]);
  const [endRepeat, setEndRepeat] = useState(new Date(route.params["endRepeat"]));
  const [minutes, setMinutes] = useState(route.params["minutes"]);

  const frequencies = ["Never", "Hourly", "Daily", "Weekly", "Yearly"];

  const saveAndReturn = async () => {
    if (title === "") {
      Alert.alert("Please enter a title.");
    } else if (startDate < new Date(Date.now())) {
      Alert.alert("Please choose a date in the future.");
    } else if (endDate < startDate) {
      Alert.alert("The end date must be after the start date.");
    }
    // else if (shouldSpeak && message === '') {
    //     Alert.alert('Please enter a message.')
    // }
    else {
      cancelNotification(notifID);
      const newNotifID = await createTriggerNotification(startDate, title);
      storage
        .load({
          key: "whens",
        })
        .then((ret) => {
          ret[index] = {
            type: "event",
            title: title,
            startDate: startDate,
            endDate: endDate,
            notifID: newNotifID,
            eventID: eventID,
            // 'shouldSpeak': shouldSpeak,
            // 'message': message,
            repeat: repeat,
            endRepeat: endRepeat,
            minutes: minutes,
          };
          storage.save({
            key: "whens",
            data: ret,
          });
        })
        .catch((err) => {
          console.warn(err.message);
        });

      updateEvent(eventID, "event", title, startDate, endDate, repeat, endRepeat);
      navigation.navigate("Home");
    }
  };

  const deleteAndReturn = () => {
    storage
      .load({
        key: "whens",
      })
      .then((ret) => {
        whens = ret;
        cancelNotification(notifID);
        RNCalendarEvents.removeEvent(eventID, {exceptionDate: startDate.toISOString(), futureEvents: true})
        .then(success => {
          whens.splice(index, 1);
          storage.save({
            key: "whens",
            data: whens,
          });
          navigation.navigate("Home");
        })
        .catch((err) => {
          console.warn(err);
          Alert.alert(
            "There was an error in removing your When. Please try again."
          );
        });
      })
      .catch((err) => {
        console.warn(err.message);
      });
  };

  const onChangeStartDate = (event, selectedDate) => {
    setStartDate(selectedDate);
    startDate.setSeconds(0);
  };

  const onChangeEndDate = (event, selectedDate) => {
    setEndDate(selectedDate);
    endDate.setSeconds(0);
  };

  const onChangeEndRepeat = (event, selectedDate) => {
    setEndRepeat(selectedDate);
    endRepeat.setHours(endDate.getHours(), endDate.getMinutes() + 1, 0);
  };

  // const onChangeShouldSpeak = () => {
  //     setShouldSpeak(previousState => !previousState);
  // };

  return (
    <SafeAreaView>
      <ScrollView
        scrollEnabled={false}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <TextInput
          placeholder="Title"
          placeholderTextColor={"lightgray"}
          value={title}
          onChangeText={(t) => setTitle(t)}
          style={styles.textInput}
        />
        <View style={styles.createReminderGroup}>
          <View style={styles.filledBox}>
            <Text style={styles.boxText}>Start</Text>
          </View>
          <DateTimePicker
            testID="dateTimePicker"
            value={startDate}
            mode={"datetime"}
            is24Hour={true}
            onChange={onChangeStartDate}
            style={styles.picker}
          />
        </View>
        <View style={styles.createReminderGroup}>
          <View style={styles.filledBox}>
            <Text style={styles.boxText}>End</Text>
          </View>
          <DateTimePicker
            testID="dateTimePicker"
            value={endDate}
            mode={"date"}
            is24Hour={true}
            onChange={onChangeEndDate}
            style={styles.picker}
          />
        </View>
        <View style={styles.line} />
        <View style={styles.createReminderGroup}>
          <View style={styles.box}>
            <Text style={styles.text}>Repeat</Text>
          </View>
          <SelectDropdown
            data={frequencies}
            defaultValue={repeat}
            buttonStyle={{
              alignSelf: "flex-end",
              marginHorizontal: 20,
              marginVertical: 10,
              width: Dimensions.get("window").width - 170,
              backgroundColor: "lightgray",
              borderRadius: 10,
            }}
            dropdownStyle={{ borderRadius: 10 }}
            onSelect={(selectedItem, index) => {
              setRepeat(selectedItem);
            }}
            buttonTextAfterSelection={(selectedItem, index) => {
              return selectedItem;
            }}
            rowTextForSelection={(item, index) => {
              return item;
            }}
          />
        </View>
        {repeat !== "Never" && (
          <View style={styles.createReminderGroup}>
            <View style={styles.box}>
              <Text style={styles.text}>End Repeat</Text>
            </View>
            <DateTimePicker
              testID="dateTimePicker"
              value={endRepeat}
              mode={"datetime"}
              is24Hour={true}
              onChange={onChangeEndRepeat}
              style={styles.picker}
            />
          </View>
        )}
        {/* <View style={styles.createReminderGroup}>
          <View style={styles.box}>
            <Text style={styles.text}>Speech</Text>
          </View>
          <View style={styles.buffer} />
          <Switch
            // trackColor={{ true: '#ff6347' }}
            onValueChange={onChangeShouldSpeak}
            value={shouldSpeak}
            style={styles.picker}
          />
        </View>
        {shouldSpeak && (
          <TextInput
            placeholder="Enter message to be spoken..."
            placeholderTextColor={"lightgray"}
            value={message}
            onChangeText={(m) => setMessage(m)}
            style={styles.smallTextInput}
          />
        )} */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.shortButton} onPress={saveAndReturn}>
            <MaterialCommunityIcons
              name={"content-save-outline"}
              size={40}
              style={{ alignSelf: "center" }}
              color="black"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortButton}
            onPress={deleteAndReturn}
          >
            <MaterialCommunityIcons
              name={"trash-can-outline"}
              size={40}
              style={{ alignSelf: "center" }}
              color="black"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewEvent;
