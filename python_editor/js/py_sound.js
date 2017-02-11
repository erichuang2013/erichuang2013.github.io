var $builtinmodule = function(name)
{
    var mod = {};
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