/* eslint-disable camelcase */
import dbClient from '../utils/dbClient.js'
import bcrypt from 'bcrypt'

export default class User {
  /**
   * This is JSDoc - a way for us to tell other developers what types functions/methods
   * take as inputs, what types they return, and other useful information that JS doesn't have built in
   * @tutorial https://www.valentinog.com/blog/jsdoc
   *
   * @param { { id: int, cohortId: int, email: string, profile: { firstName: string, lastName: string, bio: string, githubUrl: string, profileImageUrl: string, privatePosts: boolean  } } } user
   * @returns {User}
   */
  static fromDb(user) {
    return new User(
      user.id,
      user.cohortId,
      user.profile.firstName,
      user.profile.lastName,
      user.email,
      user.profile.bio,
      user.profile.githubUrl,
      user.profile.profileImageUrl,
      user.password,
      user.role,
      user.profile.privatePosts
    )
  }

  static async fromJson(json) {
    const {
      first_name,
      last_name,
      email,
      biography,
      github_url,
      profile_image_url,
      password,
      role,
      privatePosts
    } = json

    const passwordHash = await bcrypt.hash(password, 8)

    return new User(
      null,
      null,
      first_name,
      last_name,
      email,
      biography,
      github_url,
      profile_image_url,
      passwordHash,
      role,
      privatePosts
    )
  }

  constructor(
    id,
    cohortId,
    firstName,
    lastName,
    email,
    bio,
    githubUrl,
    profileImageUrl,
    passwordHash = null,
    role = 'STUDENT',
    privatePosts = false
  ) {
    this.id = id
    this.cohortId = cohortId
    this.firstName = firstName
    this.lastName = lastName
    this.email = email
    this.bio = bio
    this.githubUrl = githubUrl
    this.profileImageUrl = profileImageUrl
    this.passwordHash = passwordHash
    this.role = role
    this.privatePosts = privatePosts
  }

  toJSON() {
    return {
      user: {
        id: this.id,
        cohort_id: this.cohortId,
        role: this.role,
        first_name: this.firstName,
        last_name: this.lastName,
        email: this.email,
        biography: this.bio,
        github_url: this.githubUrl,
        profile_image_url: this.profileImageUrl,
        privatePosts: this.privatePosts
      }
    }
  }

  /**
   * @returns {User}
   *  A user instance containing an ID, representing the user data created in the database
   */
  async save() {
    const createdUser = await dbClient.user.create({
      data: {
        email: this.email,
        password: this.passwordHash,
        cohortId: this.cohortId,
        role: this.role,
        profile: {
          create: {
            firstName: this.firstName,
            lastName: this.lastName,
            bio: this.bio,
            githubUrl: this.githubUrl,
            profileImageUrl: this.profileImageUrl,
            privatePosts: this.privatePosts
          }
        }
      },
      include: {
        profile: true
      }
    })

    return User.fromDb(createdUser)
  }

  async update({
    firstName,
    lastName,
    email,
    bio,
    githubUrl,
    profileImageUrl,
    cohortId,
    privatePosts
  }) {
    console.log('privacyPrefXX', privatePosts)
    const updatedUser = await dbClient.user.update({
      where: {
        id: this.id
      },
      data: {
        email,
        cohortId,
        profile: {
          update: {
            firstName,
            lastName,
            bio,
            githubUrl,
            profileImageUrl,
            privatePosts: privatePosts
          }
        }
      },
      include: {
        profile: true
      }
    })

    return User.fromDb(updatedUser)
  }

  static async findByEmail(email) {
    return User._findByUnique('email', email)
  }

  static async findById(id) {
    return User._findByUnique('id', id)
  }

  static async findManyByFirstName(firstName) {
    return User._findMany('firstName', firstName)
  }

  static async findManyByCohortId(cohortId) {
    return User._findManyThroughUser('cohortId', cohortId)
  }

  static async findAll() {
    return User._findMany()
  }

  static async _findByUnique(key, value) {
    const foundUser = await dbClient.user.findUnique({
      where: {
        [key]: value
      },
      include: {
        profile: true
      }
    })

    if (foundUser) {
      return User.fromDb(foundUser)
    }

    return null
  }

  static async _findMany(key, value) {
    const query = {
      include: {
        profile: true
      }
    }

    if (key !== undefined && value !== undefined) {
      query.where = {
        profile: {
          [key]: value
        }
      }
    }

    const foundUsers = await dbClient.user.findMany(query)

    return foundUsers.map((user) => User.fromDb(user))
  }

  static async _findManyThroughUser(key, value) {
    const query = {
      include: {
        profile: true
      }
    }

    if (key !== undefined && value !== undefined) {
      query.where = {
        [key]: value
      }
    }

    const foundUsers = await dbClient.user.findMany(query)

    return foundUsers.map((user) => User.fromDb(user))
  }
}
