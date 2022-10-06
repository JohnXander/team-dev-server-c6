import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import dbClient from '../utils/dbClient.js'

import { myEmitter } from '../eventEmitter/index.js'
import { ServerErrorEvent, NotFoundEvent } from '../eventEmitter/utils.js'

export const createCurriculum = async (req, res) => {
  try {
    if (!req.body.name) {
      return sendMessageResponse(res, 400, 'missing curriculum name')
    }

    if (!req.body.description) {
      return sendMessageResponse(res, 400, 'missing curriculum description')
    }
    const newCurriculum = await dbClient.curriculum(req.body.name)
    // myEmitter.emit('create-cohort', createdCohort, req.user)

    return sendDataResponse(res, 201, newCurriculum)
  } catch (err) {
    const error = new ServerErrorEvent(
      req.user,
      'create-curriculum',
      'Unable to create curriculum'
    )
    myEmitter.emit('error', error)
    sendMessageResponse(res, error.code, error.message)
    throw err
  }
}

export const getAllCurriculums = async (req, res) => {
  try {
    const currs = await dbClient.curriculum.findMany()

    return sendDataResponse(res, 200, currs)
  } catch (err) {
    const error = new ServerErrorEvent(req.user, 'fetch-all-curriculums')
    myEmitter.emit('error', error)
    return sendMessageResponse(res, error.code, error.message)
  }
}

export const updateCurriculumById = async (req, res) => {
  const id = Number(req.params.id)
  const { content } = req.body

  if (!content) {
    return sendMessageResponse(res, 400, 'Must provide curriculum content')
  }

  const foundCurriculum = await dbClient.curriculum.findUnique({
    where: { id }
  })

  if (!foundCurriculum) {
    const notFound = new NotFoundEvent(
      req.user,
      `edit-curriculum-${id}`,
      'curriculum'
    )
    myEmitter.emit('error', notFound)
    return sendMessageResponse(res, notFound.code, notFound.message)
  }

  const updatedCurriculum = await dbClient.curriculum.update({
    where: { id },
    data: { content }
  })

  return sendDataResponse(res, 201, updatedCurriculum)
}

export const deleteCurriculumById = async (req, res) => {
  const id = Number(req.params.id)

  const foundCurr = await dbClient.curriculum.findUnique({ where: { id } })
  if (!foundCurr) {
    const notFound = new NotFoundEvent(
      req.user,
      `delete-curriculum-${id}`,
      'curriculum'
    )
    myEmitter.emit('error', notFound)
    return sendMessageResponse(res, notFound.code, notFound.message)
  }

  try {
    const deleted = await dbClient.curriculum.delete({ where: { id } })

    return sendDataResponse(res, 201, deleted)
  } catch (err) {
    const error = new ServerErrorEvent(req.user, `delete-curriculum-${id}`)
    myEmitter.emit('error', error)
    return sendMessageResponse(res, error.code, error.message)
  }
}

export const createModule = async (req, res) => {
  const { name, description, objectives } = req.body
  const currId = Number(req.params.id)

  if (!name) {
    return sendMessageResponse(res, 400, 'missing module name')
  }
  if (!description) {
    return sendMessageResponse(res, 400, 'missing module description')
  }
  if (!objectives) {
    return sendMessageResponse(res, 400, 'missing module objectives')
  }

  try {
    const created = await dbClient.module.create({
      data: {
        name,
        description,
        objectives,
        curriculum: { connect: { id: currId } }
      }
    })

    return sendDataResponse(res, 201, created)
  } catch (err) {
    const error = new ServerErrorEvent(req.user, 'create-model')
    myEmitter.emit('error', error)
    sendMessageResponse(res, error.code, error.message)
    throw err
  }
}

export const getAllModulesByCurr = async (req, res) => {
  const currId = Number(req.params.id)

  try {
    const modules = await dbClient.module.findMany({
      where: {
        curriculum: {
          some: {
            id: currId
          }
        }
      }
    })

    return sendDataResponse(res, 200, modules)
  } catch (err) {
    const error = new ServerErrorEvent(
      req.user,
      `fetch-modules-for-curriculum-${currId}`
    )
    myEmitter.emit('error', error)
    return sendMessageResponse(res, error.code, error.message)
  }
}

export const getAllModules = async (req, res) => {
  try {
    const allModules = await dbClient.module.findMany()
    return sendDataResponse(res, 201, { modules: allModules })
  } catch (err) {
    sendMessageResponse(res, 500, 'Unable to fetch modules')
    throw err
  }
}

export const getModuleById = async (req, res) => {
  const currId = Number(req.params.id)
  const moduleId = Number(req.params.moduleId)

  try {
    const foundModule = await dbClient.module.findFirst({
      where: {
        id: moduleId,
        curriculum: {
          some: {
            id: currId
          }
        }
      }
    })

    return sendDataResponse(res, 201, foundModule)
  } catch (err) {
    const error = new ServerErrorEvent(req.user, 'create-model')
    myEmitter.emit('error', error)
    sendMessageResponse(res, error.code, error.message)
    throw err
  }
}

export const updateModuleById = async (req, res) => {
  const { name, description, objectives } = req.body
  const currId = Number(req.params.id)
  const moduleId = Number(req.params.moduleId)

  if (!name) {
    return sendMessageResponse(res, 400, 'missing module name')
  }
  if (!description) {
    return sendMessageResponse(res, 400, 'missing module description')
  }
  if (!objectives) {
    return sendMessageResponse(res, 400, 'missing module objectives')
  }

  const foundModule = await dbClient.module.findFirst({
    where: {
      id: moduleId,
      curriculums: {
        some: {
          id: currId
        }
      }
    }
  })

  if (!foundModule) {
    const notFound = new NotFoundEvent(
      req.user,
      `edit-module-${moduleId}`,
      'module'
    )
    myEmitter.emit('error', notFound)
    return sendMessageResponse(res, notFound.code, notFound.message)
  }

  try {
    const updateModule = await dbClient.module.update({
      where: { id: moduleId },
      data: { name, description, objectives },
      include: {
        units: true,
        curriculums: true
      }
    })
    return sendDataResponse(res, 201, updateModule)
  } catch (err) {
    const error = new ServerErrorEvent(req.user, `edit-module-${moduleId}`)
    myEmitter.emit('error', error)
    sendMessageResponse(res, error.code, error.message)
    throw err
  }
}

export const deleteModuleById = async (req, res) => {
  const id = Number(req.params.id)

  const foundModule = await dbClient.module.findUnique({
    where: {
      id
    },
    include: {
      units: true
    }
  })

  if (!foundModule) {
    const notFound = new NotFoundEvent(req.user, `delete-module-${id}`, 'post')
    myEmitter.emit('error', notFound)
    return sendMessageResponse(res, notFound.code, notFound.message)
  }

  const deleteModule = await dbClient.module.delete({
    where: {
      id
    },
    include: {
      units: true
    }
  })

  return sendDataResponse(res, 201, { deleteModule })
}

export const createUnit = async (req, res) => {
  const { name, description, objectives } = req.body
  const moduleId = Number(req.params.id)

  if (!name) {
    return sendMessageResponse(res, 400, 'missing unit name')
  }
  if (!description) {
    return sendMessageResponse(res, 400, 'missing unit description')
  }
  if (!objectives) {
    return sendMessageResponse(res, 400, 'missing unit objectives')
  }

  try {
    const created = await dbClient.unit.create({
      data: {
        name,
        description,
        objectives,
        module: { connect: { id: moduleId } }
      }
    })

    return sendDataResponse(res, 201, created)
  } catch (err) {
    const error = new ServerErrorEvent(req.user, 'create-unit')
    myEmitter.emit('error', error)
    sendMessageResponse(res, error.code, error.message)
    throw err
  }
}
