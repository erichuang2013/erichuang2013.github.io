var $builtinmodule = function(name)
{
    var mod = {};
	mod.play = new Sk.builtin.func(function(url){
        play(Sk.builtin.str$(url));

        return new Sk.builtin.none;
    })
    mod.playSound = new Sk.builtin.func(function(sound_num){
        playSound(Sk.builtin.asnum$(sound_num));

        return new Sk.builtin.none;
    })
	mod.setSoundSrc = new Sk.builtin.func(function(num, url){
        setSoundSrc(Sk.builtin.asnum$(num, url));

        return new Sk.builtin.none;
    })
    return mod;
}