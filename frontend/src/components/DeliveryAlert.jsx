import React from "react";

const DeliveryAlert = ({ deliveryAlert }) => {
  return (
    <div>
      {deliveryAlert === "Raining" && (
        <div className="relative overflow-hidden rounded-b-2xl border border-blue-400/30 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4 shadow-lg">
          {/* Lightning Flash */}
          <div className="lightning"></div>

          {/* Falling Rain Drops */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <span
                key={i}
                className="absolute rain-drop"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  animationDuration: `${0.35 + Math.random() * 0.4}s`,
                  opacity: 0.2 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="text-3xl">⛈️</div>

            <div>
              <h4 className="text-sm font-bold text-white">
                Rain’s going wild outside 🌧️☔
              </h4>

              <p className="text-xs text-blue-100 leading-5 mt-1">
                It’s raining in your area 😵‍💫. Your order may take a little
                longer as our delivery partners are driving safe through the
                chaos. Stay cozy & stay dry 💙
              </p>
            </div>
          </div>
        </div>
      )}

      {deliveryAlert === "Traffic" && (
        <div className="relative overflow-hidden rounded-2xl border border-orange-400/20 bg-[#171717] p-4 shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,140,0,0.15),transparent_60%)]"></div>

          <div className="absolute bottom-0 left-0 flex w-full items-end gap-[3px] px-2 opacity-20">
            {[...Array(30)].map((_, i) => (
              <span
                key={i}
                className="traffic-bar flex-1 rounded-t-full bg-orange-400"
                style={{
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>

          <div className="absolute right-3 top-3 flex gap-2 opacity-10 text-2xl">
            <span className="animate-bounce">🚗</span>
            <span className="animate-bounce delay-150">🚕</span>
            <span className="animate-bounce delay-300">🛵</span>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 backdrop-blur-sm">
              <span className="text-2xl">🚦</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">
                  Heavy traffic nearby
                </h4>

                <span className="rounded-full bg-orange-500/15 px-2 py-[2px] text-[10px] font-medium text-orange-300">
                  Delay Expected
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-neutral-300">
                Roads in your area are currently congested. Our delivery
                partners are taking safer alternate routes to get your order
                delivered as quickly as possible.
              </p>
            </div>
          </div>
        </div>
      )}

      {deliveryAlert === "Festival" && (
        <div className="relative overflow-hidden rounded-2xl border border-pink-400/20 bg-gradient-to-br from-[#14091f] via-[#241136] to-[#3d1457] p-4 shadow-[0_0_30px_rgba(255,120,220,0.12)]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="firework-launch"
                style={{
                  left: `${10 + i * 18}%`,
                  animationDelay: `${i * 1.4}s`,
                }}
              >
                <div className="firework-trail"></div>
                <div className="firework-burst"></div>
              </div>
            ))}
          </div>

        <div className="absolute top-0 left-0 flex w-full justify-around px-2 py-1">
            {["#ff4d6d", "#ffd60a", "#00f5d4", "#9b5de5", "#ff9f1c"].map(
              (color, i) => (
                <span
                  key={i}
                  className="festival-light"
                  style={{
                    background: color,
                    boxShadow: `0 0 10px ${color}`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ),
            )}
          </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]"></div>

          <div className="relative z-10 flex items-center gap-3 pt-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md">
              <span className="text-2xl">🎆</span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Festive celebrations are live ✨
                </h4>

                <span className="rounded-full border border-pink-400/20 bg-pink-400/10 px-2 py-[2px] text-[10px] font-medium text-pink-200">
                  Peak Rush
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-purple-100/90">
                Due to festive celebrations and increased orders 🎉, delivery
                may take slightly longer than usual. Our team is working hard to
                deliver your favorites safely and quickly 💜
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryAlert;
