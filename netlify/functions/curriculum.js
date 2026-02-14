const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);

    const weeks = await sql`SELECT * FROM weeks ORDER BY id`;
    const days = await sql`SELECT * FROM days ORDER BY week_id, sort_order`;

    // Group days by week_id
    const daysByWeek = {};
    for (const day of days) {
      if (!daysByWeek[day.week_id]) daysByWeek[day.week_id] = [];
      daysByWeek[day.week_id].push({
        name: day.day_name,
        focus: day.focus_of_day,
        qotd: day.question_of_day,
        circleTime: day.circle_time,
        songTitle: day.song_title,
        songLink: day.song_link,
        learningStations: day.learning_stations,
        teacherTips: day.teacher_tips,
        outsideTime: day.outside_time,
        indoorMovement: day.indoor_movement
      });
    }

    // Shape data to match what App.jsx expects
    const result = weeks.map(w => {
      const weekDays = daysByWeek[w.id] || [];
      const day1 = weekDays[0] || {};
      return {
        id: w.id,
        theme: w.theme,
        season: w.season,
        focus: w.focus,
        ages: w.ages,
        routineGroup: w.routine_group,
        hasRichData: true,
        teachingPhilosophy: w.teaching_philosophy,
        days: weekDays,
        // Backward compat for simple view fallback
        activities: {
          circleTime: day1.circleTime || '',
          songOfDay: { title: day1.songTitle || '', link: day1.songLink || '' },
          morningActivity: (day1.learningStations || [])[0] || '',
          afternoonActivity: (day1.learningStations || [])[1] || '',
          lunch: ''
        }
      };
    });

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (error) {
    console.error('Curriculum fetch error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to load curriculum' }) };
  }
};
