// https://electronjs.org/docs/tutorial/notifications

export default class NotificationService {
  public static notify(title: string, body: string, callback?: () => void) {
    const options: NotificationOptions = {
      body,
    };

    const myNotification = new Notification(title, options);

    if (callback) {
      myNotification.onclick = callback;
    }
  }
}
