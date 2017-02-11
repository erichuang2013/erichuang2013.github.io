var $builtinmodule = function(name)
{
    var mod = {};
    mod.playSound = new Sk.builtin.func(function(sound_num){
        playSound(Sk.builtin.asnum$(sound_num));

        return new Sk.builtin.none;
    })
	mod.playSoundFromURL = new Sk.builtin.func(function(url){
        playSoundFromURL(Sk.builtin.asnum$(url));

        return new Sk.builtin.none;
    })
    return mod;
}