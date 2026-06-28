package expo.modules.movementaudio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * MovementAudio — minimal control over the device's media (STREAM_MUSIC) audio.
 *
 *  - getMusicVolume(): current + max STREAM_MUSIC volume (integer steps).
 *  - rampMusicVolume(fraction, durationMs): step the volume to the target evenly
 *    over the duration on the main thread.
 *  - stopPlayback(): briefly request AUDIOFOCUS_GAIN so other media apps pause,
 *    then abandon focus.
 */
class MovementAudioModule : Module() {

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  private val audioManager: AudioManager
    get() = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  private val mainHandler = Handler(Looper.getMainLooper())
  private var rampRunnable: Runnable? = null
  private var rampPromise: Promise? = null

  // No-op listener for the pre-O focus API (which requires a non-null listener).
  private val focusListener = AudioManager.OnAudioFocusChangeListener { }

  override fun definition() = ModuleDefinition {
    Name("MovementAudio")

    AsyncFunction("getMusicVolume") {
      val am = audioManager
      mapOf(
        "volume" to am.getStreamVolume(AudioManager.STREAM_MUSIC),
        "max" to am.getStreamMaxVolume(AudioManager.STREAM_MUSIC),
      )
    }

    AsyncFunction("rampMusicVolume") { targetFraction: Double, durationMs: Int, promise: Promise ->
      val am = audioManager

      // Supersede any in-flight ramp (settle its promise so JS doesn't hang).
      rampRunnable?.let { mainHandler.removeCallbacks(it) }
      rampPromise?.resolve(null)
      rampPromise = null
      rampRunnable = null

      val max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
      val start = am.getStreamVolume(AudioManager.STREAM_MUSIC)
      val target = (targetFraction.coerceIn(0.0, 1.0) * max).roundToInt().coerceIn(0, max)
      val distance = target - start
      val steps = abs(distance)

      // Nothing to ramp, or no duration — set immediately.
      if (steps == 0 || durationMs <= 0) {
        try {
          am.setStreamVolume(AudioManager.STREAM_MUSIC, target, 0)
        } catch (e: SecurityException) {
          promise.reject("E_AUDIO_VOLUME", "Unable to set media volume (Do Not Disturb active?)", e)
          return@AsyncFunction
        }
        promise.resolve(null)
        return@AsyncFunction
      }

      val interval = (durationMs.toLong() / steps).coerceAtLeast(16L)
      rampPromise = promise
      var i = 0
      val runnable = object : Runnable {
        override fun run() {
          i++
          val level = (start + distance * i / steps).coerceIn(0, max)
          try {
            am.setStreamVolume(AudioManager.STREAM_MUSIC, level, 0)
          } catch (e: SecurityException) {
            rampPromise?.reject("E_AUDIO_VOLUME", "Unable to set media volume (Do Not Disturb active?)", e)
            rampPromise = null
            rampRunnable = null
            return
          }
          if (i >= steps) {
            rampPromise?.resolve(null)
            rampPromise = null
            rampRunnable = null
          } else {
            mainHandler.postDelayed(this, interval)
          }
        }
      }
      rampRunnable = runnable
      mainHandler.postDelayed(runnable, interval)
    }

    AsyncFunction("stopPlayback") {
      val am = audioManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val attrs = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
          .build()
        val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
          .setAudioAttributes(attrs)
          .build()
        // GAIN (permanent) makes other media apps receive AUDIOFOCUS_LOSS and pause.
        am.requestAudioFocus(request)
        am.abandonAudioFocusRequest(request)
      } else {
        @Suppress("DEPRECATION")
        am.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        @Suppress("DEPRECATION")
        am.abandonAudioFocus(focusListener)
      }
    }

    OnDestroy {
      rampRunnable?.let { mainHandler.removeCallbacks(it) }
      rampPromise?.resolve(null)
      rampPromise = null
      rampRunnable = null
    }
  }
}
