export class AuthService {
  constructor(Firebase, FirebaseApp, FirebaseUrl, $firebaseObject, $firebaseAuth, $q, _) {
    'ngInject';

    var service = this,
      authRef = new Firebase(FirebaseUrl),
      usersRef = new Firebase(FirebaseUrl + "users");

    this.$q = $q;
    this._ = _;
    this.Firebase = Firebase;
    this.FirebaseApp = FirebaseApp;
    this.FirebaseUrl = FirebaseUrl;
    this.firebaseAuth = $firebaseAuth(authRef);
    this.$firebaseObject = $firebaseObject;
    this.users = $firebaseObject(usersRef);

    // Restore user session if possible
    this.getCurrentUser();

    // Authorization changes
    this.firebaseAuth.$onAuth(function () {
      service.getCurrentUser();
    })
  }

  getCurrentUser() {
    var service = this;
    var user = localStorage.getItem('firebase:session::' + this.FirebaseApp);
    service.currentUser = user ? angular.fromJson(user) : undefined;
    return service.currentUser;
  }

  loginWithFacebook() {
    var service = this,
        defer = this.$q.defer();

    this.firebaseAuth.$authWithOAuthPopup('facebook')
      .then(function (currentUser) {
        // Save curent user user
        service.users[currentUser.uid] = {
          uid: service._.result(currentUser, 'uid'),
          displayName: service._.result(currentUser, 'facebook.displayName'),
          avatar: service._.result(currentUser, 'facebook.profileImageURL'),
          cachedUserProfile: service._.result(currentUser, 'facebook.cachedUserProfile')
        };

        service.users.$save().then(function () {
          service.currentUser = currentUser;
          defer.resolve(service.currentUser);
        }, function (error) {
          debugger;
        })

      })
      .catch(function () {
        defer.reject();
      })

    return defer.promise;
  }

  loginWithPassword(email, password) {
    var service = this,
      defer = this.$q.defer();

    this.firebaseAuth.$authWithPassword({
      email: email,
      password: password
    })
      .then(function (currentUser) {
        // Save curent user user
        service.users[currentUser.uid] = {
          displayName: service._.result(currentUser, 'password.email'),
          avatar: service._.result(currentUser, 'password.profileImageURL')
        };

        service.users.$save().then(function () {
          service.currentUser = currentUser;
          defer.resolve(service.currentUser);
        }, function (error) {
          debugger;
        })

      })
      .catch(function () {
        defer.reject();
      })

    return defer.promise;
  }


  // loginAsGuest() {
  //   var service = this;
  //   return service.firebaseAuth.$authAnonymously()
  //     .then(function () {
  //       return service.getCurrentUser();
  //     })
  // }

  // fetchUserData(userId) {
  //   var ref = new this.Firebase(this.FirebaseUrl + "/users/" + userId);
  //   return this.$firebaseObject(ref);
  // }

  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  logout() {
    this.firebaseAuth.$unauth();
    this.getCurrentUser();
  }
}
