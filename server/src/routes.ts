import { prisma } from './lib/prisma'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import dayjs from 'dayjs'

export async function appRoute(app: FastifyInstance) {
  app.post('/habits', async (request) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    })

    const { title, weekDays } = createHabitBody.parse(request.body)

    const today = dayjs().startOf('day').toDate()

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            }
          }),
        },
      },
    })
  })

  app.get('/day', async (resquest) => {
    const getDayParams = z.object({
      date: z.coerce.date(),
    })
    const { date } = getDayParams.parse(resquest.query)

    const parsedDate = dayjs(date).startOf('day')
    const weekDay = parsedDate.get('date')

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          },
        },
      },
    })

    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        dayHabits: true,
      },
    })

    const compliteHabits = day?.dayHabits.map((daydayHabit) => {
      return daydayHabit.habit_id
    })
    return {
      possibleHabits,
      compliteHabits
    }
  })
}
